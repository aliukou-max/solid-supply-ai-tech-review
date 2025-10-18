# Solid Supply AI Tech Review

AI-powered technical review system for furniture manufacturing, built with Encore.ts and React.

## Features

- 📋 Project and product management
- 🔍 AI-powered component analysis using GPT-4
- 📸 Photo gallery for components
- 🔧 Tech review workflow with component parts
- 📊 Production error tracking
- 💡 Lessons learned database
- 🗂️ Node (standard parts) library
- 📥 Excel import/export functionality

## Tech Stack

**Backend:**
- Encore.ts - Backend framework
- PostgreSQL - Database (managed by Encore)
- OpenAI API - AI analysis

**Frontend:**
- React with TypeScript
- Vite - Build tool
- Tailwind CSS v4 - Styling
- shadcn/ui - UI components
- TanStack Query - Data fetching
- React Router - Routing

## Prerequisites

1. **Install Encore CLI:**
   ```bash
   curl -L https://encore.dev/install.sh | bash
   ```

2. **OpenAI API Key:**
   - Get your API key from https://platform.openai.com/api-keys
   - You'll need this for AI-powered component analysis

## Local Development

### 1. Clone the project

```bash
encore app clone solid-supply-ai-tech-review
cd solid-supply-ai-tech-review
```

Or using project ID:
```bash
encore app clone proj_d3p5fuc82vjikj622li0
cd solid-supply-ai-tech-review
```

### 2. Set up OpenAI secret

```bash
encore secret set --type local OpenAIKey
```

When prompted, paste your OpenAI API key.

### 3. Run the application

```bash
encore run
```

The application will be available at:
- **Frontend:** http://localhost:4000
- **Backend API:** http://localhost:4000/api
- **Local Dashboard:** http://localhost:9400

The database is automatically created and migrations are applied.

## Production Deployment

### 1. Create Encore Cloud environment

```bash
encore env create production --cloud aws --region eu-central-1
```

Or use GCP:
```bash
encore env create production --cloud gcp --region europe-west1
```

### 2. Set production secrets

```bash
encore secret set --env production OpenAIKey
```

### 3. Deploy

```bash
git add .
git commit -m "Initial deployment"
git push encore
```

Encore automatically deploys to your production environment.

## Database Migrations

Migrations are located in `backend/db/migrations/` and are automatically applied when:
- Running `encore run` locally
- Deploying to production

To create a new migration:
```bash
encore db migration create <migration_name>
```

## Environment Variables

The application uses Encore's secret management system:

- `OpenAIKey` - OpenAI API key for AI analysis (required)

Set secrets using:
```bash
# Local development
encore secret set --type local OpenAIKey

# Production
encore secret set --env production OpenAIKey
```

## Project Structure

```
/
├── backend/
│   ├── ai-analysis/         # AI component analysis
│   ├── dashboard/           # Dashboard statistics
│   ├── db/                  # Database and migrations
│   ├── lessons-learnt/      # Lessons learned module
│   ├── nodes/               # Standard parts library
│   ├── product/             # Product management
│   ├── product-types/       # Product type definitions
│   ├── production-errors/   # Error tracking
│   ├── project/             # Project management
│   └── tech-review/         # Technical review workflow
├── frontend/
│   ├── components/          # React components
│   │   ├── tech-review/    # Tech review specific components
│   │   └── ui/             # shadcn/ui components
│   ├── pages/              # Page components
│   └── App.tsx             # Root component
└── package.json
```

## Key Features Explained

### Tech Review Workflow

1. Create a project
2. Add products to the project
3. Open tech review for a product
4. Add general description (optional)
5. AI analyzes and creates component parts automatically
6. Upload photos for each component part
7. Link to standard nodes (reusable parts)
8. Track production errors
9. Reference lessons learned

### Product Types

Define standard product types with predefined parts:
- Each product type has a list of component parts
- When creating a tech review, parts are automatically created
- Ensures consistency across similar products

### AI Analysis

The system uses OpenAI GPT-4 to:
- Parse general product descriptions
- Extract component parts
- Identify materials and finishes
- Falls back to local parsing if API is unavailable

## Development Commands

```bash
# Run locally with live reload
encore run

# Run tests
encore test

# Check type errors
encore check

# View logs
encore logs

# Database shell
encore db shell
```

## Support

For Encore-related issues:
- Documentation: https://encore.dev/docs
- Discord: https://encore.dev/discord
- GitHub: https://github.com/encoredev/encore

For application-specific questions, contact the development team.

## License

Proprietary - All rights reserved
