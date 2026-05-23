const tools = [
  {
    name: 'save_structured_entry',
    description:
      'Persiste una entrada estructurada en LogOS después de parsear el input del usuario',
    input_schema: {
      type: 'object',
      properties: {
        log_id: { type: 'string' },
        type: {
          type: 'string',
          enum: ['task', 'note', 'event', 'session_log', 'reminder'],
        },
        title: { type: 'string' },
        scheduled_at: {
          type: 'string',
          description: 'ISO 8601, null si no aplica',
        },
        tags: { type: 'array', items: { type: 'string' } },
        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
        metadata: { type: 'object' },
      },
      required: ['log_id', 'type', 'title'],
    },
  },
  {
    name: 'create_calendar_event',
    description: 'Crea un evento en Google Calendar del usuario',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        start_datetime: { type: 'string', description: 'ISO 8601' },
        end_datetime: { type: 'string', description: 'ISO 8601' },
        entry_id: {
          type: 'string',
          description: 'ID de la structured_entry para registrar el evento',
        },
      },
      required: ['title', 'start_datetime', 'end_datetime', 'entry_id'],
    },
  },
  {
    name: 'log_to_discriminador',
    description:
      'Registra una sesión de estudio o progreso en el sistema Discriminador',
    input_schema: {
      type: 'object',
      properties: {
        session_type: {
          type: 'string',
          description: 'Tipo de sesión (estudio, repaso, práctica)',
        },
        subject: { type: 'string', description: 'Materia o tema' },
        duration_minutes: { type: 'number' },
        notes: { type: 'string' },
        entry_id: { type: 'string' },
      },
      required: ['session_type', 'subject', 'entry_id'],
    },
  },
  {
    name: 'update_memory',
    description:
      'Actualiza el resumen de memoria persistente del usuario con información relevante de esta conversación',
    input_schema: {
      type: 'object',
      properties: {
        new_summary: {
          type: 'string',
          description:
            'Resumen actualizado y comprimido del historial relevante del usuario',
        },
      },
      required: ['new_summary'],
    },
  },
];

module.exports = tools;
