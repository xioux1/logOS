const Anthropic = require('@anthropic-ai/sdk');
const { pool } = require('../config/db');
const memoryService = require('./memory.service');
const toolDefinitions = require('../tools/definitions');
const googleCalendar = require('./integrations/google-calendar.adapter');
const discriminador = require('./integrations/discriminador.adapter');

const client = new Anthropic();
const MODEL = 'claude-sonnet-4-20250514';

function buildSystemPrompt() {
  const now = new Date().toISOString();
  return `Sos LogOS, un asistente personal de logging inteligente.
Tu trabajo es procesar entradas en lenguaje libre y estructurarlas.
Cuando el usuario dice algo, debés:
1. Entender la intención (tarea, nota, evento, sesión de estudio, recordatorio)
2. Extraer entidades relevantes (fechas, prioridades, etiquetas, sistemas involucrados)
3. Usar las tools disponibles para persistir y sincronizar la información
4. Responder de forma concisa confirmando qué hiciste

Tenés memoria de conversaciones anteriores. Usala para dar contexto.
Hablá en el idioma del usuario (español o inglés según lo que use).
Sé breve y directo. No hagas preguntas innecesarias.

Fecha y hora actual: ${now}`;
}

// Execute a single tool call requested by Claude
async function executeTool(toolName, toolInput, context) {
  const { userId, logId, userToken } = context;

  switch (toolName) {
    case 'save_structured_entry': {
      const {
        log_id,
        type,
        title,
        scheduled_at = null,
        tags = [],
        priority = null,
        metadata = {},
      } = toolInput;

      const result = await pool.query(
        `INSERT INTO logos.structured_entries
           (log_id, type, title, scheduled_at, tags, priority, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [log_id || logId, type, title, scheduled_at, tags, priority, JSON.stringify(metadata)]
      );
      return { entry_id: result.rows[0].id, status: 'saved' };
    }

    case 'create_calendar_event': {
      const { title, description, start_datetime, end_datetime, entry_id } = toolInput;
      try {
        const event = await googleCalendar.createEvent(
          { title, description, start: start_datetime, end: end_datetime },
          userId
        );
        await pool.query(
          `INSERT INTO logos.integration_events
             (entry_id, system, external_id, status)
           VALUES ($1, 'google_calendar', $2, 'success')`,
          [entry_id, event.id]
        );
        return { google_event_id: event.id, status: 'created' };
      } catch (err) {
        await pool.query(
          `INSERT INTO logos.integration_events
             (entry_id, system, status, error)
           VALUES ($1, 'google_calendar', 'failed', $2)`,
          [entry_id, err.message]
        ).catch(() => {});
        return { status: 'failed', error: err.message };
      }
    }

    case 'log_to_discriminador': {
      const { session_type, subject, duration_minutes, notes, entry_id } = toolInput;
      try {
        const data = await discriminador.logSession(
          { session_type, subject, duration_minutes, notes },
          userToken
        );
        await pool.query(
          `INSERT INTO logos.integration_events
             (entry_id, system, external_id, status)
           VALUES ($1, 'discriminador', $2, 'success')`,
          [entry_id, String(data?.id || '')]
        );
        return { status: 'logged', discriminador_id: data?.id };
      } catch (err) {
        await pool.query(
          `INSERT INTO logos.integration_events
             (entry_id, system, status, error)
           VALUES ($1, 'discriminador', 'failed', $2)`,
          [entry_id, err.message]
        ).catch(() => {});
        return { status: 'failed', error: err.message };
      }
    }

    case 'update_memory': {
      const { new_summary } = toolInput;
      await memoryService.updateMemory(userId, { summary: new_summary });
      return { status: 'memory_updated' };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function processEntry(rawText, userId, userToken) {
  // 1. Load user memory
  const memory = await memoryService.getMemory(userId);

  // 2. Insert the raw log immediately so we have a log_id for tools
  const logResult = await pool.query(
    `INSERT INTO logos.logs (user_id, raw_text) VALUES ($1, $2) RETURNING id`,
    [userId, rawText]
  );
  const logId = logResult.rows[0].id;

  // 3. Build message history
  const messages = [];

  if (memory.raw_history && memory.raw_history.length > 0) {
    messages.push(...memory.raw_history);
  }

  // Inject log_id into the user message so Claude can reference it
  messages.push({
    role: 'user',
    content: `[log_id: ${logId}]\n${rawText}`,
  });

  const context = { userId, logId, userToken };
  const toolsUsed = [];

  // 4. Agentic loop
  let response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(),
    tools: toolDefinitions,
    messages,
  });

  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
    const toolResults = [];

    for (const block of toolUseBlocks) {
      const result = await executeTool(block.name, block.input, context);
      toolsUsed.push({ tool: block.name, input: block.input, result });
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    // Append assistant turn + tool results
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(),
      tools: toolDefinitions,
      messages,
    });
  }

  const assistantText = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // 5. Persist the final assistant turn to memory
  const newTurns = [
    { role: 'user', content: `[log_id: ${logId}]\n${rawText}` },
    { role: 'assistant', content: assistantText },
  ];
  await memoryService.updateMemory(userId, { newTurns });

  // 6. Fetch saved structured entries for the response
  const entriesResult = await pool.query(
    `SELECT * FROM logos.structured_entries WHERE log_id = $1`,
    [logId]
  );

  return {
    log_id: logId,
    assistant_response: assistantText,
    tools_used: toolsUsed,
    structured_entries: entriesResult.rows,
  };
}

module.exports = { processEntry };
