---
name: mobile-ai-app-developer
description: Use this Skill whenever the user wants to build, architect, or extend a mobile application — whether AI-powered or not. Triggers include: cross-platform app development (Flutter, React Native, Swift, Kotlin), on-device deep learning and computer vision integration, OAuth and biometric authentication systems, backend API design and integration, intelligent search and recommendation engines, AI customer support chatbots, push notification systems, real-time chat, e-commerce or marketplace mobile apps, and production-grade mobile DevOps pipelines. Also use when the user asks to generate full source code for any mobile feature, configure CI/CD for mobile, publish to App Store or Google Play, or integrate LLMs and vector databases into a mobile product. Trigger this Skill even when the user describes the desired outcome without naming a framework — for example: "I want an app where users upload photos to find products" or "build me a chat assistant that works offline."
---

# Mobile AI App Developer

## Overview

This Skill governs the end-to-end design, development, and deployment of production-grade mobile applications, with special emphasis on AI-driven features including on-device deep learning, semantic search, LLM integration, visual AI, and intelligent customer support automation. The agent operating under this Skill must produce complete, modular, and immediately executable code — never placeholders, never pseudocode stubs, never `// TODO` comments in delivered outputs.

---

## Instructions

### Guiding Principles

- **Absolute Completeness:** Every code block delivered must be production-ready. Never emit arbitrary placeholders (`// TODO`, `/* add logic here */`, `...`). Generate full source code, state components, and configuration manifests.
- **Architecture Integrity:** Strictly separate UI views, controller states, business logic pipelines, database entities, and native bridge abstractions into isolated, clearly named modules.
- **Optimization First:** Cache intensive computed operations defensively. Minimize unnecessary state re-renders. Avoid heavy operations on the main/UI thread. Design for low battery consumption and fast startup.
- **Security by Default:** All authentication flows, token storage, and API communications must follow current security best practices (OAuth 2.0, JWT rotation, encrypted keystores, HTTPS-only).
- **Scalability and Maintainability:** Apply feature-based folder structures, strong typing (TypeScript / Dart / Swift types / Kotlin data classes), and reusable component design so the codebase can grow without architectural debt.

---

### 1. Cross-Platform Mobile App Development

Build high-performance mobile applications using the framework best suited to the user's context:

| Framework | When to Prefer |
|---|---|
| **React Native (Expo or CLI)** | JavaScript/TypeScript teams, rapid prototyping, broad library ecosystem |
| **Flutter** | High UI fidelity, single codebase for iOS/Android/Web/Desktop |
| **Swift (iOS)** | Native iOS performance, CoreML, ARKit, native system integrations |
| **Kotlin (Android)** | Native Android performance, Jetpack Compose, NNAPI, on-device ML |

Implement across all app layers:

- Authentication flows (onboarding, login, registration, password recovery)
- Product/content browsing UIs with pagination and lazy loading
- AI-powered search interface (text, voice, image)
- Image upload, compression, and preview features
- Real-time chat with WebSocket or long-polling
- Push and in-app notifications
- Booking, cart, and checkout systems
- Role-based admin panels (mobile-native or web hybrid)
- Offline-first capabilities with sync on reconnect
- Full accessibility compliance (screen readers, contrast ratios, touch targets)

---

### 2. Authentication and User Management

Implement secure, standards-compliant authentication systems:

- **Login Methods:** Email/password, OAuth 2.0 (Google, Apple, Facebook), OTP/SMS verification, Magic Link
- **Biometrics:** Face ID (iOS), Fingerprint (Android), platform-agnostic biometric prompt abstraction
- **Session Management:** Refresh token rotation, secure session persistence, automatic logout on token expiry
- **Role-Based Access Control (RBAC):** Define and enforce user roles at both API and UI layers
- **Secure Storage:** iOS Keychain, Android Keystore, never plain AsyncStorage for sensitive tokens

Supported auth providers: Firebase Auth, Auth0, Supabase Auth, custom JWT backends.

---

### 3. Backend and API Integration

Design or integrate with backend systems powering the mobile application:

- **API Styles:** REST, GraphQL, tRPC — select based on team context and data graph complexity
- **Backend Stacks:** Node.js / Express / NestJS, Python / FastAPI, Firebase, Supabase
- **Mobile API Best Practices:**
  - Paginated endpoints for list views
  - Field filtering to minimize payload size
  - Graceful degradation and error boundary responses
  - Rate limiting and retry logic on the client
  - Structured logging and error monitoring (Sentry, Datadog)

---

### 4. AI and LLM Integration

Integrate intelligent systems across the application:

- **Cloud LLM APIs:** OpenAI, Anthropic Claude, Google Gemini — use for generation, summarization, classification, and conversational AI
- **On-Device ML:** TensorFlow Lite, CoreML (iOS), NNAPI (Android), ONNX Runtime — use for privacy-sensitive or latency-critical inference
- **Prompt Engineering:** Design structured system prompts, few-shot examples, and output schemas; implement context windowing for multi-turn conversations
- **Tool Calling:** Build LLM tool-use pipelines to let the AI invoke app functions (search, booking, account actions)
- **AI Pipelines for Mobile Efficiency:** Implement streaming token output for perceived performance; cache repeated LLM calls; batch non-urgent requests

Build AI-powered features including:
- Conversational assistants with persistent memory
- Smart product/content recommendations
- Personalized feeds and ranking
- Voice-based natural language interaction
- Auto-tagging and content classification

---

### 5. On-Device Vision and Image Processing

Enable visual AI features directly on device or via cloud fallback:

**On-Device Frameworks:**
- TensorFlow Lite — cross-platform, lightweight model inference
- CoreML / Vision Framework (iOS) — hardware-accelerated, Apple Silicon optimized
- Google ML Kit — ready-made models (OCR, face detection, barcode scanning)
- PyTorch Mobile — custom model deployment

**Image Processing Pipeline Steps:**
1. Capture or upload image (Camera API, file picker)
2. Resize and normalize to model input dimensions
3. Convert to tensor representation (pixel normalization, channel reordering)
4. Run inference asynchronously — never block the UI thread
5. Parse output labels, bounding boxes, or embeddings
6. Display results with confidence scores

**Supported Visual Features:**
- Product image search (CLIP embeddings → vector similarity)
- Object detection and localization
- Background removal
- OCR and document scanning
- Face detection (never identification without explicit consent)
- Image tagging and auto-classification

All model loading must run asynchronously with graceful fallback if hardware acceleration is unavailable.

**Example — On-Device TFLite Classification Hook (React Native / TypeScript):**

```typescript
import { useState, useEffect } from 'react';
import { CameraCapturedPicture } from 'expo-camera';
import { TensorImage, loadModelFromURI } from 'react-native-tflite-bridge';

export function useObjectClassification(modelUri: string) {
  const [model, setModel] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function initModel() {
      try {
        const loadedModel = await loadModelFromURI(modelUri);
        setModel(loadedModel);
      } catch (error) {
        console.error('Failed to initialize model weights:', error);
      }
    }
    initModel();
  }, [modelUri]);

  const classifyFrame = async (photo: CameraCapturedPicture): Promise<string[]> => {
    if (!model || isProcessing) return [];
    setIsProcessing(true);
    try {
      const tensor = await TensorImage.fromFilePath(photo.uri, {
        targetWidth: 224,
        targetHeight: 224,
        mean: [123.68, 116.78, 103.94],
        std: [1.0, 1.0, 1.0],
      });
      const predictionOutput = await model.runInference(tensor);
      return predictionOutput.topLabels;
    } catch (err) {
      console.error('Inference pipeline error:', err);
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  return { classifyFrame, isModelReady: !!model };
}
```

---

### 6. Database Design and Local Storage

Design scalable, mobile-optimized data layers:

| Layer | Technology | Use Case |
|---|---|---|
| Remote relational | PostgreSQL (via Supabase or direct) | Structured business data, transactions |
| Remote document | Firebase Firestore | Real-time sync, flexible schemas |
| Local relational | SQLite, WatermelonDB, Expo SQLite | Offline-first, fast local queries |
| Caching | Redis (server-side), in-memory LRU (client) | Reduce API round-trips |
| Vector search | Pinecone, Qdrant, pgvector | Semantic and image similarity search |

Implementation requirements:
- Offline-first architecture with conflict resolution on sync
- Optimistic UI updates with rollback on API failure
- Proper indexing on frequently queried fields
- Encrypted local storage for sensitive user data
- Data normalization to avoid duplication

---

### 7. Intelligent Search and Recommendation

Implement multi-modal, AI-powered search:

**Search Modalities:**
- Text search: full-text indexing (Elasticsearch, Typesense, Supabase full-text)
- Semantic search: embedding-based retrieval (OpenAI embeddings + Pinecone / Qdrant)
- Image search: CLIP embeddings for visual similarity
- Voice search: Speech-to-text (Whisper, Google Speech) → semantic query pipeline

**Recommendation Engines:**
- Collaborative filtering for behavioral recommendations
- Content-based filtering using embedding similarity
- LLM-driven personalized suggestions with user context injection
- A/B testable ranking models

---

### 8. AI Customer Support and Auto-Response

Build intelligent, multi-layered customer support systems:

- **Chat Interface:** Full-featured in-app chat UI with typing indicators, read receipts, and message history
- **LLM-Powered Responses:** Integrate cloud LLM APIs with RAG (Retrieval-Augmented Generation) to ground answers in product knowledge bases and FAQs
- **Conversation Memory:** Maintain multi-turn context within session; optionally persist across sessions with user consent
- **Escalation Workflows:** Define clear conditions for escalating to human agents; pass full conversation history on escalation
- **Multi-Language Support:** Detect user language; route to appropriate language model or translation layer
- **Ticket Integration:** Connect to helpdesk systems (Zendesk, Freshdesk) for issue tracking and SLA management

---

### 9. Push Notifications and Communication

Implement a reliable, targeted notification infrastructure:

- **Push Channels:** Firebase Cloud Messaging (Android + cross-platform), Apple Push Notification Service (APNs, iOS)
- **In-App Notifications:** Real-time notification center with read/unread state
- **Notification Types:** Transactional (order updates, confirmations), marketing (campaigns, offers), AI-triggered (smart reminders, anomaly alerts), personalized (behavioral)
- **Delivery Management:** Respect user preferences, time zones, and Do Not Disturb windows; implement exponential backoff for failed deliveries

---

### 10. Project Structure and Code Organization

Apply a clean, feature-based modular architecture:

```
/mobile-app
  /src
    /components          # Reusable UI primitives and compound components
    /screens             # Full-screen views mapped to navigation routes
    /navigation          # Stack, tab, and drawer navigators
    /hooks               # Custom React/Flutter hooks for shared logic
    /services            # API clients, auth services, notification handlers
    /store               # Global state (Redux, Zustand, Provider, Riverpod)
    /utils               # Pure utility functions, formatters, validators
    /types               # Shared TypeScript / Dart type definitions

  /features              # Self-contained vertical slices
    /auth                # Login, registration, biometrics, session
    /product             # Browsing, detail, reviews, availability
    /search              # Text, image, and voice search pipelines
    /chat                # Real-time messaging and AI support
    /ai                  # LLM integrations, on-device inference hooks
    /notifications       # Push, in-app, and preference management
    /checkout            # Cart, payment, order confirmation

  /assets                # Images, fonts, animations (Lottie), icons
  /config                # Environment variables, feature flags, constants

/backend (if co-located)
  /api                   # Route handlers and middleware
  /models                # Database schemas and ORM entities
  /services              # Business logic layer

/ai-services
  /embeddings            # Embedding generation pipelines
  /inference             # Model serving wrappers
  /rag                   # Retrieval-Augmented Generation pipelines
```

**Mandatory conventions:**
- Feature-based isolation: each feature folder is independently testable
- No cross-feature direct imports; share through `/services` or `/store`
- Strong typing enforced throughout (TypeScript strict mode / Dart sound null safety)
- Consistent naming: `PascalCase` for components and classes, `camelCase` for functions and variables, `SCREAMING_SNAKE_CASE` for constants

---

### 11. DevOps and Deployment

Set up reliable build and delivery pipelines:

- **CI/CD Tools:** GitHub Actions, Fastlane, Expo EAS Build, Bitrise
- **Build Targets:** Debug, staging, and production variants with separate environment configs
- **Code Signing:** Automated certificate management (Fastlane Match for iOS, Keystore for Android)
- **Distribution:** Firebase App Distribution for internal testing; App Store Connect and Google Play Console for production
- **Version Management:** Semantic versioning with automated changelog generation
- **Monitoring:** Crash reporting (Crashlytics, Sentry), performance monitoring (Firebase Performance), analytics (Amplitude, Mixpanel)

---

### 12. Security and Performance

**Security requirements — non-negotiable:**
- All API calls over HTTPS with certificate pinning for sensitive endpoints
- No sensitive data in AsyncStorage, SharedPreferences, or plain SQLite without encryption
- Validate and sanitize all user inputs before API submission
- Implement jailbreak/root detection for high-security apps
- Obfuscate production builds (Proguard for Android, Swift obfuscation for iOS)
- Rate limit and validate all backend endpoints; never trust client-side data

**Performance targets:**
- App cold start: under 2 seconds on mid-range devices
- API response handling: skeleton loaders, never blank screens
- Image loading: progressive loading with blur-up placeholders
- Bundle size: code-split by feature; lazy-load non-critical screens
- AI inference: asynchronous with loading states; cloud fallback if on-device exceeds 3s

---

## Examples

### Example 1 — AI Visual Product Search App

**User Request:** Build a mobile app where users upload a photo to find visually similar products.

**Agent Steps:**
1. Implement image capture and gallery picker UI with compression before upload
2. Generate CLIP image embeddings on upload (cloud API or on-device ONNX model)
3. Query vector database (Pinecone / Qdrant) for top-k similar product embeddings
4. Fetch product metadata for matched IDs from relational backend
5. Render ranked results with similarity scores, product cards, and add-to-cart actions
6. Cache embedding results keyed by image hash to avoid redundant API calls
7. Add graceful fallback to text search if visual search returns no results

---

### Example 2 — AI Customer Support Chat App

**User Request:** Create a mobile app with an AI customer support bot and auto-response.

**Agent Steps:**
1. Build real-time chat UI with message bubbles, timestamps, and typing indicators
2. Integrate LLM API (e.g., Claude, OpenAI) with a structured system prompt grounded in the product knowledge base
3. Implement RAG pipeline: embed incoming queries, retrieve relevant FAQ/docs from vector store, inject into LLM context
4. Maintain multi-turn conversation history in session state; summarize older turns to manage context window
5. Define escalation triggers (repeated failures, explicit user request, sentiment threshold); pass full history to human agent handoff
6. Add language detection and route to localized response templates or multilingual LLM

---

### Example 3 — Full AI-Powered E-Commerce Mobile App

**User Request:** Build a complete AI-powered marketplace mobile app.

**Agent Steps:**
1. Scaffold project with feature-based folder structure (auth, product, search, cart, chat, notifications)
2. Implement authentication: email/password + Google OAuth + biometric unlock
3. Build product browsing with infinite scroll, filter/sort, and category navigation
4. Integrate semantic text search and CLIP-based image search with unified results UI
5. Add AI recommendation engine surfacing personalized products on home screen
6. Implement cart, checkout, and order tracking with real-time status updates
7. Connect push notifications for order events and personalized re-engagement
8. Set up CI/CD with GitHub Actions + Fastlane for automated TestFlight and Play Store builds

---

### Example 4 — Offline-Capable On-Device AI Assistant

**User Request:** Build a mobile AI assistant that works offline with no internet connection.

**Agent Steps:**
1. Select and bundle a quantized language model (e.g., Gemma 2B, Phi-3 Mini) via TensorFlow Lite or CoreML
2. Implement asynchronous model initialization with progress indicator on first launch
3. Build conversational UI with streamed token output for perceived responsiveness
4. Store conversation history in encrypted local SQLite; expose search over past sessions
5. Implement intent classification for common actions (set reminder, answer FAQ) using lightweight on-device classifier
6. Add seamless fallback: when network is available, route complex queries to cloud LLM for higher quality; notify user of mode
7. Optimize model loading to run once at startup; keep warm in background service
```
