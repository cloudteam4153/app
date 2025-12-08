# Unified Inbox Assistant

A Desktop unified-inbox assistant that connects to Gmail and Slack, pulls new messages, and classifies them into actionable To-dos with due dates and owners.

## Features

- Gmail + Slack integration
- Message classification into actionable tasks
- Daily Brief of what needs attention
- Reminders for missed items
- Read, triage, create tasks, send quick replies
- Local cache and fast search

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev


```

## Project Structure

```
UI/
├── src/
│   ├── App.jsx          # Main app component
│   ├── App.css          # App styles
│   ├── main.jsx         # Entry point
│   ├── index.css        # Global styles
│   ├── config/
│   │   └── api.js       # API configuration (base URL, endpoints)
│   ├── services/
│   │   └── api.js       # API service layer for composite microservice
│   └── pages/           # Page components
├── composite-ms1/       # Composite microservice (read-only reference)
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── README.md            # This file
```

## API Integration

The UI interfaces with a composite microservice that coordinates multiple atomic microservices. The API service layer is located in `src/services/api.js` and provides functions to interact with:

- **Integrations Service**: Connections, messages, and syncs
- **Actions Service**: Tasks, todos, and followups
- **Classification Service**: Message classification, briefs, and AI-generated tasks

### Configuration

Before using the API, update the VM public IP address in `src/config/api.js`:

```javascript
const COMPOSITE_MS_IP = 'YOUR_VM_PUBLIC_IP_HERE'; // Replace with actual IP
```

### Usage Example

```javascript
import { integrationsAPI, actionsAPI, classificationAPI } from './services/api.js';

// Fetch messages
const messages = await integrationsAPI.listMessages({ limit: 50 });

// Create a task
const task = await actionsAPI.createTask({
  title: 'Review project proposal',
  user_id: 1,
  priority: 3
});

// Classify messages
const classifications = await classificationAPI.classifyMessages({
  message_ids: ['uuid1', 'uuid2']
});
```

For complete API documentation, see the composite microservice README in `composite-ms1/README.md`.

