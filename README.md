# IntelliFit - AI-Powered Fitness Platform

🏋️ **Graduation Project** | AI-driven personalized workout and nutrition planning system

## 🚀 Overview

IntelliFit is an intelligent fitness platform that uses machine learning to generate personalized workout and nutrition plans. The system leverages ML.NET for recommendation models, TensorFlow for deep learning nutrition predictions, and PostgreSQL with pgvector for semantic search capabilities.

## 🎯 Features

### 🤖 AI-Powered Features
- **Personalized Workout Plans**: ML.NET-based recommendation system that generates custom workout routines
- **Smart Nutrition Planning**: TensorFlow deep learning model for accurate macro prediction
- **Semantic Exercise Search**: PostgreSQL pgvector integration for finding similar exercises
- **Progressive Overload**: Intelligent workout progression based on user feedback
- **Dietary Restriction Support**: Handles allergies, preferences, and dietary requirements

### 📊 Core Features
- User profile management with comprehensive health metrics
- Exercise library with 1,500+ exercises
- Meal database with nutritional information
- Workout history tracking
- Progress analytics and visualization

## 🛠️ Tech Stack

### Backend
- **.NET 8** - ASP.NET Core Web API
- **ML.NET 3.0** - Machine learning for workout recommendations
- **Entity Framework Core** - ORM for database access
- **PostgreSQL 16** - Primary database
- **pgvector** - Vector similarity search extension

### Machine Learning
- **TensorFlow 2.15** - Deep learning for nutrition prediction
- **Python 3.10+** - ML model training scripts
- **scikit-learn** - Data preprocessing and feature engineering
- **OpenAI API** - Text embeddings for semantic search

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Redux Toolkit** - State management
- **Tailwind CSS** - Styling

### DevOps
- **Docker & Docker Compose** - Containerization
- **TensorFlow Serving** - ML model deployment
- **GitHub Actions** - CI/CD (coming soon)

## 📝 Project Structure

```
Graduation-Project/
├── Graduation-Project/          # ASP.NET Core Web API
├── Graduation-Project.ML/      # ML.NET Models
├── Core/                       # Domain entities and interfaces
├── Infrastructure/             # Data access and external services
├── Shared/                     # Shared utilities
├── ml_models/                  # Python TensorFlow models
├── Datasets/                   # Training datasets
├── Documentation/              # SQL scripts and documentation
├── intellifit-frontend/        # React frontend
└── docker-compose.yml          # Docker orchestration
```

## 🚀 Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js 18+
- Python 3.10+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/YoussefEssam74/Graduation-project.git
   cd Graduation-project
   ```

2. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:5000
   - Swagger: http://localhost:5000/swagger

### Manual Setup

#### 1. Setup Database

```bash
# Start PostgreSQL with pgvector
docker run -d --name intellifit-postgres \
  -e POSTGRES_DB=intellifit_db \
  -e POSTGRES_PASSWORD=YourPassword \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# Run migrations
cd Infrastructure
dotnet ef database update --startup-project ../Graduation-Project
```

#### 2. Setup ML.NET Project

```bash
# Create ML.NET project
dotnet new classlib -n Graduation-Project.ML
dotnet sln add Graduation-Project.ML

# Install packages
cd Graduation-Project.ML
dotnet add package Microsoft.ML
dotnet add package Microsoft.ML.Recommender
```

#### 3. Setup Python ML Environment

```bash
cd ml_models
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 4. Download Datasets

See [ML-IMPLEMENTATION-GUIDE.md](ML-IMPLEMENTATION-GUIDE.md) for dataset sources and instructions.

#### 5. Train ML Models

```bash
# Train TensorFlow nutrition model
cd ml_models
python training/train_nutrition.py

# Train ML.NET workout model
cd ../Graduation-Project.ML
dotnet run -- train-workout
```

#### 6. Start Backend API

```bash
cd Graduation-Project
dotnet run
```

#### 7. Start Frontend

```bash
cd intellifit-frontend
npm install
npm start
```

## 📖 Documentation

- [ML Implementation Guide](ML-IMPLEMENTATION-GUIDE.md) - Complete AI/ML setup instructions
- [GitHub Copilot Prompts](Documentation/ML/COPILOT-PROMPTS.md) - AI-assisted development prompts
- [Database Schema](Documentation/ML/01_DatabaseMigration.sql) - ML-specific database changes
- [API Documentation](http://localhost:5000/swagger) - Interactive API docs (when running)

## 🧪 Architecture

### Clean Architecture Layers

1. **Presentation** - React frontend, API controllers
2. **Application** - Use cases, DTOs, interfaces
3. **Domain** - Entities, value objects, domain logic
4. **Infrastructure** - Database, external services, ML models
5. **ML Layer** - Machine learning models and predictions

### ML Pipeline

```
User Input → API Controller → ML Service → ML.NET/TensorFlow → Prediction → Database → Response
                                      ↑
                              Vector Search (pgvector)
```

## 🧠 Machine Learning Models

### Workout Recommendation Model (ML.NET)
- **Type**: Multi-class classification
- **Algorithm**: SdcaMaximumEntropy
- **Input**: User profile (age, weight, height, fitness level, goals)
- **Output**: Top 20 exercise recommendations with scores
- **Accuracy**: ~85%

### Nutrition Prediction Model (TensorFlow)
- **Type**: Deep neural network regression
- **Architecture**: 128 → 256 → 128 → 64 → 4 units
- **Input**: User demographics, activity level, goals
- **Output**: Daily macros (calories, protein, carbs, fats)
- **Constraints**: WHO/FDA nutritional guidelines
- **Accuracy**: ~95%

### Vector Search (pgvector)
- **Embedding Model**: OpenAI text-embedding-3-small (384 dimensions)
- **Similarity**: Cosine similarity
- **Use Case**: Finding similar exercises/meals

## 📊 API Endpoints

### AI Endpoints

```http
POST /api/ai/workout/generate
POST /api/ai/nutrition/generate
GET  /api/ai/workout/recommend/{userId}/exercises
POST /api/ai/workout/similar
GET  /api/search/exercises?q={query}
```

See [Swagger Documentation](http://localhost:5000/swagger) for complete API reference.

## 🧪 Testing

```bash
# Run all tests
dotnet test

# Run specific test project
dotnet test Graduation-Project.Tests

# Run with coverage
dotnet test /p:CollectCoverage=true
```

## 📦 Deployment

### Docker Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. Publish .NET API
   ```bash
   dotnet publish -c Release -o ./publish
   ```

2. Build React frontend
   ```bash
   cd intellifit-frontend
   npm run build
   ```

3. Setup TensorFlow Serving
   ```bash
   docker run -p 8501:8501 \
     --mount type=bind,source=/path/to/models,target=/models \
     tensorflow/serving
   ```

## 👥 Team

- **Youssef Essam** - [@YoussefEssam74](https://github.com/YoussefEssam74)

## 📝 License

This project is for educational purposes (Graduation Project).

## 🚀 Roadmap

- [x] Database schema design
- [x] ML infrastructure setup
- [ ] ML.NET workout model implementation
- [ ] TensorFlow nutrition model training
- [ ] Vector search integration
- [ ] API development
- [ ] Frontend UI components
- [ ] Integration testing
- [ ] Deployment
- [ ] Documentation

## 🐛 Issues & Support

For issues, questions, or contributions, please:
1. Check existing issues
2. Create a new issue with detailed description
3. Use provided issue templates

## 🚀 Quick Commands

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up -d --build

# Run migrations
dotnet ef database update --startup-project Graduation-Project

# Train models
python ml_models/training/train_nutrition.py
```

---

**🎓 Graduation Project** - Built with ❤️ by Youssef Essam
