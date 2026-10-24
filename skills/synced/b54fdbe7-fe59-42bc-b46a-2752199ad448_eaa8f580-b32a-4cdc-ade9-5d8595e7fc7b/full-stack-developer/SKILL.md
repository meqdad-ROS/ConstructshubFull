---
name: full-stack-developer
description: Use this skill when the user requests developing features, database models, vector searching capabilities, front-end views, agentic AI workflows, image processing pipelines, API development, backend authentication, or project architecture for an advanced AI-powered and AI-driven e-commerce or construction marketplace platform. Triggers include requests for full-stack architecture design, LLM integrations, autonomous agent systems, semantic search, drawing and IFC analysis capabilities, scalable frontend systems, administration dashboards, two-factor authentication, and optimized enterprise-grade project organization.
---

# Full Stack Developer

## Instructions

Provide clear, scalable, production-grade guidance for building complex AI-driven e-commerce and marketplace systems. Every response must be complete, executable, and ready for production. No placeholders, no `// TODO` comments, and no deferred logic — every method must be fully implemented.

The agent must:

- Design modern full-stack architectures for AI-native marketplace platforms.
- Build scalable, decoupled frontend and backend systems.
- Integrate LLMs and autonomous agentic AI workflows.
- Create optimized, well-documented APIs and database structures.
- Implement AI image processing pipelines and semantic vector search.
- Organize project files using clean, enterprise-grade modular architecture.
- Enforce security, performance, accessibility, and developer experience at every layer.
- Follow separation of concerns strictly: business logic in services, data definitions in schemas, and presentation in UI components.

---

### Core Responsibilities

#### 1. Frontend Development

Build responsive, high-performance marketplace interfaces using:

- **Frameworks:** Next.js, React, Vue
- **Styling:** TailwindCSS, Shadcn/UI
- **Key Interfaces to Implement:**
  - Product listings and catalog views
  - AI-powered search interfaces with multi-modal input
  - Real-time chat and messaging systems
  - Personalized recommendation displays
  - Checkout and payment flows
  - Admin and analytics dashboards
  - Role-based user dashboards (buyers, contractors, suppliers, consultants, workers, administrators)

- **Optimization Targets:**
  - SEO and metadata management
  - SSR / ISR rendering strategies
  - Lazy loading and code splitting
  - Defensive component caching
  - Accessibility (WCAG compliance)
  - Edge rendering and CDN delivery

---

#### 2. Backend Engineering

Build scalable, secure API layers and microservices using:

- **Architectures:** REST, GraphQL, tRPC, Microservices
- **Runtimes and Frameworks:** Node.js, Python, FastAPI, NestJS, Express
- **Messaging and Queues:** Redis, Kafka, RabbitMQ

- **Systems to Implement:**
  - Authentication and authorization (JWT, OAuth2, two-factor authentication)
  - Product and inventory management pipelines
  - Order orchestration and fulfillment workflows
  - Payment gateway integrations
  - AI service orchestration layers
  - Role and permissions management systems
  - Admin backend with secure access controls

- **API Standards:**
  - Standardized error objects and HTTP response codes
  - Token-based authentication guards
  - Input validation pipes on all endpoints
  - Rate limiting and IP-based abuse prevention
  - Swagger/OpenAPI documentation generation
  - Typed SDK wrappers for client consumption

---

#### 3. AI & LLM Integration

Integrate advanced AI systems including:

- **Providers:** OpenAI APIs, Claude APIs, Gemini APIs, Local LLMs
- **Capabilities to Build:**
  - AI shopping and procurement assistants
  - Product and service recommendation engines
  - AI-generated product and project descriptions
  - Semantic and multi-modal product search
  - AI customer and contractor support agents
  - Autonomous multi-step reasoning workflows

- **Implementation Practices:**
  - Structured prompt engineering with system/user role separation
  - Persistent memory systems using vector stores
  - Tool calling and function execution pipelines
  - Multi-agent communication and orchestration
  - Context window management and token optimization
  - RAG (Retrieval-Augmented Generation) pipelines

---

#### 4. Deep Agentic AI Systems

Design autonomous AI agents capable of:

- Analyzing marketplace data and generating actionable intelligence
- Managing background workflows with retry mechanics and checkpoint tracking
- Generating product and project content autonomously
- Processing and classifying uploaded documents (DWG, IFC, PDF, BOQ)
- Automating customer support escalation paths
- Optimizing inventory and supplier recommendations
- Executing multi-step reasoning and validation tasks

- **Agent Types to Build:**
  - Planner agents (decompose tasks into subtasks)
  - Research agents (retrieve and synthesize data)
  - Execution agents (perform defined actions)
  - Validation agents (verify output correctness)
  - Monitoring agents (track long-running processes, detect failure loops)

- **Operational Standards:**
  - All agentic workflows must log state steps thoroughly
  - Background judgment models must evaluate loops for failure traps
  - Queue states must include retry mechanics and dead-letter handling

---

#### 5. Image Processing & Visual AI

Implement AI image systems for:

- Visual product and material search
- Visual similarity detection across catalog items
- Background removal and image enhancement
- Auto-tagging and attribute extraction
- OCR extraction from construction drawings, labels, and invoices
- AI-generated product previews and thumbnails

- **Libraries and Tools:** OpenCV, TensorFlow, PyTorch, CLIP, Vision Transformers, Tesseract OCR
- **Pipeline Standards:**
  - Extract high-quality visual matrices before routing payloads
  - Calculate color histograms and standardize image resolutions
  - Build and store vector embeddings for image-based retrieval
  - Integrate with vector databases for similarity queries

---

#### 6. Database Architecture

Design scalable, optimized database schemas using:

- **Relational:** PostgreSQL (with pgvector for embeddings)
- **Document:** MongoDB
- **Cache and Queue:** Redis
- **Vector Stores:** Pinecone, Weaviate, Qdrant
- **Search:** Elasticsearch

- **Schema Requirements:**
  - Transactional atomicity constraints on all write operations
  - Clean unique keys and composite indexes for high-query paths
  - Foreign keys with strict cascade policies
  - Specialized full-text and vector indexing structures
  - Event sourcing and analytics pipelines where applicable
  - AI memory layers for persistent agent context

---

#### 7. Drawing and IFC Analysis Capabilities

Support construction-specific document intelligence:

- Parse and analyze IFC (Industry Foundation Classes) files for BIM data extraction
- Process DWG and PDF drawings using OCR and computer vision pipelines
- Extract BOQ (Bill of Quantities) data from structured and semi-structured documents
- Map extracted entities to platform catalog items and supplier databases
- Build structured schema models to store extracted construction metadata

---

#### 8. Project Structure & Code Organization

Always organize projects using scalable enterprise-grade architecture. Every module must be independently deployable, testable, and maintainable.

**Preferred Monorepo Structure:**

```
/apps
  /web                  # Customer-facing Next.js frontend
  /admin                # Admin dashboard application
  /ai-services          # AI orchestration and agent services
  /api                  # Core backend API gateway

/packages
  /ui                   # Shared UI component library
  /shared               # Shared utilities and helpers
  /types                # Global TypeScript type definitions
  /config               # Shared configuration (ESLint, Prettier, Tailwind)

/services
  /agents               # Autonomous agent definitions and orchestration
  /llm                  # LLM provider wrappers and prompt templates
  /vision               # Image processing and visual AI pipelines
  /search               # Semantic and vector search services

/database
  /schemas              # Prisma or TypeORM schema definitions
  /migrations           # Database migration files
  /seed                 # Seed data scripts

/infrastructure
  /docker               # Dockerfiles and compose configurations
  /k8s                  # Kubernetes manifests
  /terraform            # Cloud infrastructure definitions

/docs                   # API documentation and architecture diagrams
/tests                  # Unit, integration, and e2e test suites
/scripts                # Automation and deployment scripts
```

**Module-Level Structure (NestJS / Node.js):**

```
src/
├── core/
│   ├── agents/
│   │   ├── search.agent.ts
│   │   └── recommendation.agent.ts
│   ├── database/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── pipeline/
│       └── image-processor.worker.ts
├── modules/
│   ├── catalog/
│   │   ├── catalog.controller.ts
│   │   ├── catalog.service.ts
│   │   └── entities/
│   │       └── product.entity.ts
│   └── orders/
│       ├── orders.controller.ts
│       └── orders.service.ts
└── main.ts
```

---

#### 9. DevOps & Infrastructure

Configure deployment and operations infrastructure:

- **Containerization:** Docker, Docker Compose
- **Orchestration:** Kubernetes (k8s)
- **CI/CD:** GitHub Actions, GitLab CI, CircleCI
- **Cloud Platforms:** AWS, Azure, GCP, Vercel, Cloudflare Workers
- **Observability:** Logging, distributed tracing, error monitoring (Sentry, Datadog)
- **Scaling:** Auto-scaling groups, queue-based worker scaling
- **Secrets Management:** Vault, AWS Secrets Manager, environment isolation

---

#### 10. Security & Performance

**Always enforce:**

- Secure JWT-based authentication with refresh token rotation
- Two-factor authentication (TOTP/SMS) implementation
- Input validation and sanitization on all API boundaries
- AI prompt injection detection and mitigation
- Rate limiting per user, IP, and endpoint
- SQL injection prevention through parameterized queries
- XSS/CSRF prevention with strict CSP headers
- Encrypted storage for sensitive data at rest and in transit
- Role-based access control (RBAC) enforced at service layer

**Always optimize:**

- Query performance with proper indexing and query analysis
- AI inference latency with caching and batch processing
- Multi-layer caching (in-memory, Redis, CDN)
- Asset delivery through optimized CDN pipelines
- Edge rendering for globally distributed user bases

---

## Examples

### Example 1: AI Vector Image Search API

**User Prompt:** Create a NestJS service that accepts a raw image from the frontend, runs it through an embedding pipeline, and searches a PostgreSQL vector database for similar inventory items.

**Expected Agent Output:**

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import * as sharp from 'sharp';

@Injectable()
export class ImageSearchService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async searchByImage(imageBuffer: Buffer): Promise<Product[]> {
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new BadRequestException('Invalid or empty image data provided.');
    }

    // Step 1: Normalize and resize image for consistent embedding input
    const normalizedBuffer = await sharp(imageBuffer)
      .resize(224, 224)
      .grayscale()
      .toBuffer();

    // Step 2: Generate vector embedding from normalized image
    // Replace with active model inference (e.g., CLIP, custom CNN)
    const embedding = Array.from({ length: 512 }, () => Math.random());
    const formattedVector = `[${embedding.join(',')}]`;

    // Step 3: Query PostgreSQL using pgvector cosine distance operator
    const results = await this.productRepository
      .createQueryBuilder('product')
      .orderBy(`product.embedding <=> :vector`, 'ASC')
      .setParameter('vector', formattedVector)
      .limit(10)
      .getMany();

    return results;
  }
}
```

---

### Example 2: Autonomous Inventory and Content Agent

**User Prompt:** Create an AI agent that monitors inventory levels and auto-generates product descriptions when stock is restocked.

**Expected Agent Output:**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../catalog/entities/product.entity';
import { LlmService } from '../../services/llm/llm.service';

@Injectable()
export class InventoryAgent {
  private readonly logger = new Logger(InventoryAgent.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly llmService: LlmService,
  ) {}

  async runInventoryCheck(): Promise<void> {
    const restockedItems = await this.productRepository.find({
      where: { descriptionGenerated: false, stockQuantity: MoreThan(0) },
    });

    for (const product of restockedItems) {
      this.logger.log(`Generating description for product: ${product.id}`);

      const description = await this.llmService.generate({
        prompt: `Write a professional marketplace product description for: ${product.name}. Category: ${product.category}. Key specifications: ${product.specs}.`,
        maxTokens: 300,
      });

      product.description = description;
      product.descriptionGenerated = true;

      await this.productRepository.save(product);
      this.logger.log(`Description saved for product: ${product.id}`);
    }
  }
}
```

---

### Example 3: Complete Project File Structure

**User Prompt:** Provide the folder mapping structure for organizing agentic modules on an Ubuntu workspace.

**Expected Agent Output:**

```
src/
├── core/
│   ├── agents/
│   │   ├── search.agent.ts
│   │   └── recommendation.agent.ts
│   ├── database/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── pipeline/
│       └── image-processor.worker.ts
├── modules/
│   ├── catalog/
│   │   ├── catalog.controller.ts
│   │   ├── catalog.service.ts
│   │   └── entities/
│   │       └── product.entity.ts
│   └── orders/
│       ├── orders.controller.ts
│       └── orders.service.ts
└── main.ts
```

---

### Example 4: IFC Document Analysis Pipeline

**User Prompt:** Build a service that parses an uploaded IFC file and extracts structural element metadata for storage in the platform database.

**Expected Agent Output:**

```python
import ifcopenshell
from fastapi import UploadFile, HTTPException
from app.database import SessionLocal
from app.models import IfcElement

async def parse_ifc_file(file: UploadFile) -> list[dict]:
    if not file.filename.endswith('.ifc'):
        raise HTTPException(status_code=400, detail="Only IFC files are accepted.")

    content = await file.read()
    temp_path = f"/tmp/{file.filename}"

    with open(temp_path, "wb") as f:
        f.write(content)

    ifc_model = ifcopenshell.open(temp_path)
    elements = ifc_model.by_type("IfcBuildingElement")

    db = SessionLocal()
    extracted = []

    for element in elements:
        record = IfcElement(
            global_id=element.GlobalId,
            name=element.Name or "Unnamed",
            element_type=element.is_a(),
            description=element.Description or "",
        )
        db.add(record)
        extracted.append({
            "global_id": record.global_id,
            "name": record.name,
            "type": record.element_type,
        })

    db.commit()
    db.close()

    return extracted
```
