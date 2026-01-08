# FABIE PROJECT - README FIRST
# DEVELOPER ONBOARDING & ARCHITECTURE OVERVIEW

**Version:** 1.0  
**Date:** December 30, 2025  
**Project:** Fabie - AI-Powered Manufacturing Marketplace  
**Author:** FEWA Studio Inc. / FABLORD

---

## 🎯 START HERE

**Welcome to the Fabie development team!**

This document is your **entry point** to the Fabie project. Read this first before diving into the detailed technical specifications.

**What you'll find here:**
- Project vision and business model (5 min)
- Solution architecture overview (10 min)
- Technology stack and key decisions (10 min)
- MVP scope vs. Phase 2 roadmap (5 min)
- Document navigation guide (5 min)

**Total reading time:** ~35 minutes

**After reading this, you'll know:**
- ✅ What Fabie is and why it matters
- ✅ How the system architecture works
- ✅ What technologies we're using and why
- ✅ What you're building in MVP vs. what comes later
- ✅ Which detailed specs to read next for your role

---

## TABLE OF CONTENTS

### PART 1: PROJECT OVERVIEW
1.1 What is Fabie?  
1.2 The Problem We're Solving  
1.3 Our Solution  
1.4 Target Market  
1.5 Business Model  
1.6 Competitive Differentiation  

### PART 2: SOLUTION ARCHITECTURE
2.1 High-Level Architecture  
2.2 System Components  
2.3 Data Flow  
2.4 Technology Stack  
2.5 Infrastructure & Deployment  

### PART 3: CORE FEATURES (MVP)
3.1 Feature Matrix  
3.2 Digital Product Passports (DPPs)  
3.3 NAFTA/CUSMA Automation  
3.4 AI-Powered Intelligent Matching  
3.5 Search & Discovery  
3.6 Verification & Trust System  

### PART 4: KEY TECHNICAL PREMISES
4.1 Architecture Decisions  
4.2 Database Design Philosophy  
4.3 API Design Principles  
4.4 Security & Compliance  
4.5 Performance Requirements  

### PART 5: MVP VS. PHASE 2
5.1 MVP Scope (Months 1-7)  
5.2 Phase 2 Enhancements (Months 8-18)  
5.3 Future Vision (Months 19+)  

### PART 6: GETTING STARTED
6.1 Document Navigation Guide  
6.2 Reading Path by Role  
6.3 Development Workflow  
6.4 Key Contacts  

---

---

# PART 1: PROJECT OVERVIEW

---

## 1.1 WHAT IS FABIE?

**Fabie** is an **AI-powered B2B marketplace** that connects Ontario's 30,000+ manufacturers for buying and selling:
- Equipment (CNC machines, inspection equipment, tooling)
- Raw materials (metals, plastics, chemicals)
- Finished parts (surplus, prototype runs, excess inventory)
- Manufacturing services (machining, coating, welding, fabrication)

**Core Innovation:**
Fabie goes beyond traditional marketplaces by offering:

1. **Digital Product Passports (DPPs)** - Structured, searchable product data with complete documentation
2. **Granular NAFTA/CUSMA Tracking** - Automated input-by-input country-of-origin tracking and Certificate of Origin generation
3. **AI-Powered Intelligent Matching** - Proactive material upgrade recommendations with Total Cost of Ownership (TCO) analysis

**Think of Fabie as:**
- **Alibaba** - but focused on North American manufacturing, with quality verification
- **ThomasNet** - but with transactional capability and AI-powered recommendations
- **Industry 4.0 Platform** - connecting the fragmented SME manufacturing ecosystem

---

## 1.2 THE PROBLEM WE'RE SOLVING

### Problem 1: Fragmented Manufacturing Ecosystem

**Current State:**
- 30,000+ manufacturers in Ontario alone
- 95% are SMEs (<500 employees)
- **No central marketplace** - buyers use word-of-mouth, Google, trade shows
- **High search costs** - finding the right supplier takes weeks
- **Information asymmetry** - hard to verify quality, capabilities, certifications

**Impact:**
- Lost sales opportunities (sellers can't find buyers)
- Suboptimal purchases (buyers settle for "good enough")
- Inefficient capital utilization (idle equipment, excess inventory)

---

### Problem 2: NAFTA/CUSMA Compliance Burden

**Current State:**
- Manufacturers track NAFTA content in **Excel spreadsheets**
- Manual RVC calculations (error-prone, time-consuming)
- 8-12 hours per product to prepare Certificate of Origin
- High audit risk (incomplete documentation, calculation mistakes)

**Impact:**
- Missed tariff savings (6.5% duty on $1M exports = $65K lost)
- Delayed shipments (customs holds due to incorrect certificates)
- Compliance anxiety (fear of CBSA audits, penalties up to 400% of duty)

---

### Problem 3: Suboptimal Material Selections

**Current State:**
- Buyers search by keyword ("stainless steel 1500F")
- Marketplaces return **passive results** (keyword matches only)
- **No intelligence** - buyer doesn't know better alternatives exist
- Example: Buyer searches 321 SS for 1,500°F exhaust, doesn't know Inconel 600 would last 2.5× longer

**Impact:**
- Premature component failure (wrong material for application)
- Higher total cost of ownership (frequent replacements)
- Lost value for sellers (can't differentiate premium materials)

---

## 1.3 OUR SOLUTION

### Solution 1: Structured Marketplace with Digital Product Passports

**What:**
- Every listing is a **Digital Product Passport (DPP)** with structured data
- 4 asset types: Equipment, Raw Material, Finished Part, Service
- **Granular searchability** - filter by material grade, certification, location, etc.
- **Complete documentation** - photos, specs, mill certs, calibration reports, all in one place

**Impact:**
- Buyers find exactly what they need in minutes (not weeks)
- Sellers differentiate on quality, not just price
- Trust through transparency (verified documentation)

---

### Solution 2: Automated NAFTA/CUSMA Compliance

**What:**
- **Input-by-input tracking** - materials, labor, overhead, all with country-of-origin
- **Automatic RVC calculation** - no spreadsheets, no manual math
- **One-click Certificate of Origin** - CBSA Form B232 auto-populated
- **Odoo ERP integration** - sync Bill of Materials → NAFTA inputs

**Impact:**
- Setup time: 2-3 hours per product (first time), <30 min updates
- ROI: $40K+ annual tariff savings typical
- Audit-ready documentation (6-year retention, version history)

---

### Solution 3: AI-Powered Intelligent Matching

**What:**
- AI **understands application context** from search query
- **Detects performance gaps** (e.g., material operating at temperature limit)
- **Recommends superior alternatives** with quantified TCO analysis
- **Automated seller outreach** (consultative sales opportunity)

**Example (Scenario #11):**
```
User searches: "stainless steel high temperature exhaust 1500F"

Traditional marketplace: Returns 321 SS (keyword match)

Fabie AI:
  1. Detects: 321 SS max temp = 1,500°F (ZERO safety margin!)
  2. Recommends: Inconel 600 (max temp = 2,150°F, +650°F margin)
  3. Calculates: $170K TCO savings over 10 years (despite 80% higher $/lb)
  4. Alerts seller: Consultative sales opportunity (not price-based)
```

**Impact:**
- Buyers avoid costly mistakes (wrong material → failure)
- Sellers differentiate on value (not just price)
- Marketplace becomes **proactive optimizer** (not passive catalog)

---

## 1.4 TARGET MARKET

### Primary Market: Ontario Manufacturing SMEs

**Size:**
- 30,000+ manufacturing businesses in Ontario
- 95% are SMEs (<500 employees)
- $70B+ annual manufacturing output

**Industries:**
- Automotive (Tier 1-3 suppliers)
- Aerospace (components, tooling)
- Industrial machinery
- Metal fabrication
- Plastics & packaging

**User Personas:**
- **Pete (Buyer):** Procurement Manager, 38, needs NAFTA compliance for exports
- **Ronnie (Seller):** Service Center Owner, 52, wants to monetize spare capacity
- **Maya (Admin):** Operations Manager, 29, ensures platform quality

---

### Geographic Expansion (Phase 2+)

**Year 1:** Ontario (launch market)  
**Year 2:** Expand to Quebec, Western Canada  
**Year 3:** US expansion (Great Lakes states: Michigan, Ohio, Pennsylvania)  

---

## 1.5 BUSINESS MODEL

### Revenue Streams

**1. Transaction Fees (Primary)**
- 3-5% commission on completed transactions
- Buyer pays (included in purchase price)
- Only charged when deal closes (aligned incentives)

**2. Premium Subscriptions (Secondary)**
- Basic listing: Free
- Premium tier: $99/month (featured listings, advanced analytics)
- Enterprise tier: $499/month (API access, white-label, dedicated support)

**3. Value-Added Services (Future)**
- Third-party inspection coordination (Tier 4 verification)
- Escrow services (secure payments)
- Freight/logistics coordination
- Financing facilitation

---

### Market Entry Strategy

**Phase 1: Launch Partnership (CME)**
- Partner with **Canadian Manufacturers & Exporters (CME)**
- 10,000+ members, established trust
- Technology Adoption programs (grants up to $50K)
- Co-marketing, joint webinars

**Phase 2: Regional Clusters**
- Waterloo Region (tech manufacturing)
- Hamilton (steel, automotive)
- London (food processing, advanced manufacturing)

**Phase 3: Industry Verticals**
- Start with automotive (largest sector, high NAFTA needs)
- Expand to aerospace, medical devices

---

## 1.6 COMPETITIVE DIFFERENTIATION

### vs. Alibaba / Global Marketplaces

| Feature | Alibaba | **Fabie** |
|---------|---------|-----------|
| **Geography** | Global (mostly Asia) | North American focus |
| **Quality Control** | Minimal (buyer beware) | **Verification tiers (4 levels)** |
| **NAFTA Tracking** | None | **Automated, granular** |
| **AI Matching** | Keyword search only | **Proactive optimization** |
| **Trust** | Low (scams common) | **High (verified docs, local)** |

---

### vs. ThomasNet / Industry Directories

| Feature | ThomasNet | **Fabie** |
|---------|-----------|-----------|
| **Listing Type** | Directory (contact info) | **Transactional marketplace** |
| **Documentation** | None | **Digital Product Passports** |
| **NAFTA Help** | None | **Automated compliance** |
| **AI Recommendations** | None | **Intelligent matching + TCO** |
| **Pricing** | Hidden (RFQ required) | **Transparent (upfront prices)** |

---

### Defensible Moat

**1. Network Effects**
- More sellers → more buyers → more sellers (virtuous cycle)
- AI gets smarter with data (recommendation quality improves)

**2. Switching Costs**
- NAFTA tracking data valuable (6-year retention required)
- Integrated with Odoo ERP (hard to migrate)
- Verified documentation (time-consuming to recreate)

**3. First-Mover Advantage**
- No direct competitor combining: Marketplace + NAFTA + AI
- Early partnerships (CME) create barriers to entry

---

---

# PART 2: SOLUTION ARCHITECTURE

---

## 2.1 HIGH-LEVEL ARCHITECTURE

### Three-Tier Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     PRESENTATION TIER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Web App      │  │ Mobile App   │  │ Admin        │         │
│  │ (React/Vue)  │  │ (Phase 2)    │  │ Dashboard    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/REST API
┌────────────────────────────────────────────────────────────────┐
│                     APPLICATION TIER                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ API Server (Django/Flask or Node.js/Express)             │ │
│  │                                                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │ Auth        │  │ DPP         │  │ NAFTA       │    │ │
│  │  │ Service     │  │ Service     │  │ Service     │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  │                                                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │ Search      │  │ AI Matching │  │ Messaging   │    │ │
│  │  │ Service     │  │ Engine      │  │ Service     │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Background Workers (Celery/Bull)                         │ │
│  │  • Document processing (AI classification, OCR, NER)     │ │
│  │  • NAFTA calculations                                    │ │
│  │  • Email notifications                                   │ │
│  │  • Certificate generation                                │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                            ↕ SQL/JSONB
┌────────────────────────────────────────────────────────────────┐
│                     DATA TIER                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ PostgreSQL 14+ (Primary Database)                        │ │
│  │  • Users, DPPs, NAFTA, Inquiries, Watchlist             │ │
│  │  • JSONB for flexible schemas (core_attributes, etc.)   │ │
│  │  • PostGIS extension (geographic search)                │ │
│  │  • Full-text search (pg_trgm)                           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Redis 7+ (Caching & Session Store)                      │ │
│  │  • Search result caching                                 │ │
│  │  • User session management                               │ │
│  │  • Real-time features (future: notifications)           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Cloud Storage (AWS S3 / Azure Blob)                     │ │
│  │  • Photos (DPP images)                                   │ │
│  │  • Documents (mill certs, calibration reports, PDFs)    │ │
│  │  • Generated certificates (CBSA Form B232)              │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

### Architecture Style: Modular Monolith (MVP)

**Why Modular Monolith (not Microservices)?**

✅ **Faster development** - Single codebase, shared database  
✅ **Simpler deployment** - One application to deploy  
✅ **Lower infrastructure costs** - No inter-service communication overhead  
✅ **Easier debugging** - Single stack trace, unified logging  
✅ **Future-proof** - Logical modules can be extracted to microservices later  

**Modules:**
- `auth` - User authentication, authorization, RBAC
- `dpp` - Digital Product Passport CRUD, search
- `nafta` - NAFTA tracking, RVC calculation
- `ai` - Intelligent matching, recommendations, TCO
- `documents` - Upload, classification, extraction, validation
- `messaging` - Seller-buyer communication
- `admin` - Verification queue, user management

---

## 2.2 SYSTEM COMPONENTS

### Frontend (Presentation Tier)

**Technology:** React 18+ with TypeScript  
**Alternative:** Vue.js 3+ (equally valid choice)

**Key Libraries:**
- **UI Components:** shadcn/ui (Tailwind-based, customizable)
- **State Management:** React Context + Hooks (MVP), Redux Toolkit (if needed)
- **Forms:** React Hook Form + Zod (validation)
- **Data Fetching:** TanStack Query (React Query)
- **Routing:** React Router v6
- **Charts:** Recharts (NAFTA pie charts, analytics)

**Pages:**
- Homepage
- Search Results
- DPP Detail
- Create/Edit DPP
- User Dashboard (Buyer/Seller)
- Admin Dashboard
- NAFTA Input Management
- Certificate Generation

---

### Backend (Application Tier)

**Technology:** Django 5+ with Django REST Framework  
**Alternative:** Node.js + Express (equally valid)

**Why Django?**
- ✅ Batteries included (ORM, admin, auth out-of-box)
- ✅ Strong ORM for complex queries (NAFTA calculations)
- ✅ Excellent PostgreSQL support (JSONB, full-text search)
- ✅ Mature ecosystem (packages for everything)

**If choosing Node.js:**
- Express + TypeScript
- Prisma (ORM) or TypeORM
- Passport.js (auth)

**Key Packages (Django):**
- `djangorestframework` - REST API
- `django-cors-headers` - CORS handling
- `celery` - Background tasks
- `pillow` - Image processing
- `pdfkit` or `weasyprint` - PDF generation
- `boto3` - AWS S3 integration

---

### Database (Data Tier)

**Primary Database:** PostgreSQL 14+

**Why PostgreSQL?**
- ✅ JSONB (flexible schemas for `core_attributes`, `extracted_data`)
- ✅ Full-text search (pg_trgm extension)
- ✅ PostGIS (geographic search - find suppliers within 50 km)
- ✅ ACID compliance (critical for transactions)
- ✅ Mature, battle-tested

**Tables (9 core):**
1. `users` - User accounts, companies, roles
2. `dpp_core` - Digital Product Passports (all asset types)
3. `documents` - Uploaded files (photos, certs, declarations)
4. `nafta_content` - NAFTA tracking summary
5. `nafta_inputs` - Input-by-input costs and origins
6. `verification_history` - Tier upgrade audit trail
7. `qr_codes` - QR code generation tracking
8. `inquiries` - Buyer-seller messages
9. `watchlist` - Saved listings

---

### Caching Layer

**Technology:** Redis 7+

**Use Cases:**
- **Search result caching** - Cache common queries (5 min TTL)
- **Session store** - User login sessions
- **Rate limiting** - API throttling (per-user, per-IP)
- **Real-time features** (Phase 2) - Pub/sub for notifications

---

### Cloud Storage

**Technology:** AWS S3 or Azure Blob Storage

**Buckets/Containers:**
- `fabie-photos` - DPP images (public-read)
- `fabie-documents` - Uploaded docs (private, signed URLs)
- `fabie-certificates` - Generated CBSA forms (private)

**Access:**
- Pre-signed URLs (temporary access, 1-hour expiry)
- CloudFront/Azure CDN for photo delivery

---

### AI/ML Services

**NLP (Natural Language Processing):**
- **MVP:** OpenAI GPT-4 API (entity extraction, intent classification)
- **Phase 2:** Custom models (spaCy, Hugging Face) - lower cost, faster

**Document Processing:**
- **OCR:** AWS Textract or Google Cloud Vision
- **Table Extraction:** AWS Textract (structured data from mill certs)
- **Classification:** Custom model (document_type detection)

**Technical Library:**
- **Storage:** PostgreSQL table (`materials`, `application_guidelines`)
- **Data Sources:** ASM Handbooks, MatWeb, NIST, supplier datasheets

---

## 2.3 DATA FLOW

### Example: User Creates DPP with NAFTA Tracking

```
[User fills multi-step form]
         │
         ↓
[Frontend validates data (Zod schema)]
         │
         ↓
[POST /api/v1/dpp/finished_part]
         │
         ↓
[Backend validates (Django serializer)]
         │
         ↓
[Create DPP record in database]
         │
         ↓
[If NAFTA enabled: Create nafta_content record]
         │
         ↓
[User adds NAFTA inputs (materials, labor)]
         │
         ↓
[POST /api/v1/nafta/{nafta_id}/inputs]
         │
         ↓
[Create nafta_input records]
         │
         ↓
[Trigger background task: Calculate RVC]
         │
         ↓
[Celery worker: NAFTARVCCalculator.calculate()]
         │
         ↓
[Update nafta_content with results]
         │
         ↓
[Notify user: "RVC calculated: 100%, Qualifies!"]
         │
         ↓
[User clicks "Generate Certificate"]
         │
         ↓
[Trigger background task: Generate CBSA Form B232]
         │
         ↓
[Celery worker: Create PDF, upload to S3]
         │
         ↓
[Update nafta_content.certificate_pdf_url]
         │
         ↓
[Notify user: "Certificate ready! [Download]"]
```

---

## 2.4 TECHNOLOGY STACK

### Complete Stack Summary

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
├─────────────────────────────────────────────────────┤
│ Framework:     React 18+ / Vue.js 3+               │
│ Language:      TypeScript                          │
│ Styling:       Tailwind CSS                        │
│ UI Library:    shadcn/ui                           │
│ State:         React Context / Redux Toolkit       │
│ Forms:         React Hook Form + Zod               │
│ Data Fetching: TanStack Query                      │
│ Charts:        Recharts                            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   BACKEND                           │
├─────────────────────────────────────────────────────┤
│ Framework:     Django 5+ DRF / Node.js + Express  │
│ Language:      Python 3.11+ / TypeScript           │
│ ORM:           Django ORM / Prisma                 │
│ Auth:          JWT (djangorestframework-simplejwt) │
│ Tasks:         Celery (Python) / Bull (Node.js)   │
│ API Docs:      OpenAPI/Swagger                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   DATABASE                          │
├─────────────────────────────────────────────────────┤
│ Primary DB:    PostgreSQL 14+                      │
│ Extensions:    JSONB, pg_trgm, PostGIS             │
│ Cache:         Redis 7+                            │
│ Storage:       AWS S3 / Azure Blob                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   AI/ML                             │
├─────────────────────────────────────────────────────┤
│ NLP:           OpenAI GPT-4 API (MVP)              │
│ OCR:           AWS Textract / Google Vision        │
│ Custom Models: spaCy, Hugging Face (Phase 2)      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE                    │
├─────────────────────────────────────────────────────┤
│ Cloud:         AWS / Azure                         │
│ CDN:           CloudFront / Azure CDN              │
│ Hosting:       EC2/ECS / Azure App Service         │
│ CI/CD:         GitHub Actions / GitLab CI          │
│ Monitoring:    Datadog / CloudWatch                │
└─────────────────────────────────────────────────────┘
```

---

## 2.5 INFRASTRUCTURE & DEPLOYMENT

### AWS Architecture (Recommended)

```
┌──────────────────────────────────────────────────┐
│              USER TRAFFIC                        │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ Route 53 (DNS)                                   │
│ fabie.ca → CloudFront distribution               │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│ CloudFront (CDN)                                 │
│ • Static assets (React build)                    │
│ • Photo delivery (S3 origin)                     │
│ • Cache API responses (optional)                 │
└──────────────────────────────────────────────────┘
         │                        │
         ↓ Static                 ↓ API
┌─────────────────┐     ┌────────────────────────┐
│ S3 (Static)     │     │ Application Load       │
│ React build     │     │ Balancer (ALB)         │
└─────────────────┘     └────────────────────────┘
                                 ↓
                    ┌────────────────────────┐
                    │ ECS Fargate or EC2     │
                    │ Django API containers  │
                    │ • Auto-scaling (2-10)  │
                    └────────────────────────┘
                                 ↓
         ┌───────────────────────┼───────────────────┐
         ↓                       ↓                   ↓
┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐
│ RDS PostgreSQL  │  │ ElastiCache      │  │ S3             │
│ (Primary DB)    │  │ Redis            │  │ • Photos       │
│ • Multi-AZ      │  │ (Cache)          │  │ • Documents    │
│ • Automated     │  │                  │  │ • Certificates │
│   backups       │  │                  │  │                │
└─────────────────┘  └──────────────────┘  └────────────────┘
```

### Deployment Strategy

**Environments:**
1. **Development** - Local (Docker Compose)
2. **Staging** - AWS (mirrors production, lower specs)
3. **Production** - AWS (high availability)

**CI/CD Pipeline (GitHub Actions):**
```
[Git Push] → [Run Tests] → [Build Docker Image] → [Push to ECR]
                                                         ↓
[Deploy to Staging] → [QA Testing] → [Manual Approval] → [Deploy to Production]
```

**Deployment Method:**
- **Blue-Green Deployment** (zero downtime)
- ECS task definition update → gradual traffic shift (10% → 50% → 100%)
- Automatic rollback on error rate spike

---

---

# PART 3: CORE FEATURES (MVP)

---

## 3.1 FEATURE MATRIX

### MVP Features (Must-Have) - 304 Story Points

| Feature Category | Story Points | Priority | Status |
|------------------|--------------|----------|--------|
| **Authentication & User Management** | 17 | P0 | Sprint 1 |
| **DPP Creation & Management** | 52 | P0 | Sprint 3-4 |
| **Search & Discovery** | 42 | P0 | Sprint 5-6 |
| **NAFTA Tracking & Automation** | 42 | P0 | Sprint 7-8 |
| **Document Processing (AI)** | 63 | P1 | Sprint 9-10 |
| **Verification System** | 26 | P1 | Sprint 7-8 |
| **Messaging** | 26 | P1 | Sprint 6 |
| **User Dashboard** | 26 | P1 | Sprint 5-6 |
| **QR Code Generation** | 10 | P2 | Sprint 4 |
| **TOTAL MVP** | **304** | - | **15 sprints** |

---

### Phase 2 Features (Deferred)

| Feature Category | Estimated Story Points | Timeline |
|------------------|----------------------|----------|
| **AI Matching Enhancements** (material upgrades, TCO calculator) | 60 | Month 8-10 |
| **Odoo ERP Integration** (BOM sync, inventory sync) | 55 | Month 9-12 |
| **Advanced Search** (map view, saved searches, email alerts) | 35 | Month 8-9 |
| **Third-Party Inspections** (Tier 4 certification) | 40 | Month 11-13 |
| **Transactional Features** (escrow, smart contracts) | 80 | Month 14-18 |
| **Mobile Apps** (iOS, Android) | 120 | Month 12-18 |

---

## 3.2 DIGITAL PRODUCT PASSPORTS (DPPs)

### What are DPPs?

**Digital Product Passports** are structured, machine-readable product listings with complete documentation.

**4 Asset Types:**
1. **Equipment** - CNC machines, inspection equipment, tooling
2. **Raw Material** - Metals, plastics, chemicals in bulk
3. **Finished Part** - Components, subassemblies, surplus inventory
4. **Service** - Machining, coating, welding, fabrication capacity

---

### Key Features

**1. Structured Data Schema**
- Asset-type-specific fields (e.g., Equipment has hours, calibration date)
- JSONB `core_attributes` (flexible, searchable)
- Standard fields: name, description, pricing, availability, location

**2. Complete Documentation**
- Photos (primary + gallery)
- Technical documents (mill certs, calibration reports, PPAP packages)
- AI-powered classification and validation

**3. Verification Tiers (4 levels)**
- **Tier 1: Basic** - Self-declared data only
- **Tier 2: Document-Supported** - One validated formal doc (mill cert, calibration cert)
- **Tier 3: Fully Verified** - Complete documentation set (material certs + quality docs + NAFTA)
- **Tier 4: Third-Party Certified** - Independent inspection report (Phase 2)

**4. QR Code Integration**
- Each DPP has unique QR code
- Scan → view public DPP page
- Useful for physical assets (machine tags, material lots)

---

### Example: Finished Part DPP

```json
{
  "dpp_id": "uuid-12345",
  "asset_type": "finished_part",
  "asset_name": "ABS Terminal Covers (Injection Molded)",
  "asset_description": "High-impact ABS terminal covers...",
  "seller_id": "uuid-seller-67890",
  
  "core_attributes": {
    "material": "ABS Plastic (Cycolac FR15U)",
    "dimensions": "2.5\" × 1.8\" × 0.6\"",
    "weight": "0.12 lbs",
    "color": "Black",
    "finish": "Textured",
    "certifications": ["UL 94 V-0"],
    "hs_code": "3926.90"
  },
  
  "pricing": {
    "base_price": 1.15,
    "currency": "CAD",
    "volume_tiers": [
      {"min_qty": 1000, "max_qty": 4999, "price": 1.10},
      {"min_qty": 5000, "max_qty": null, "price": 1.05}
    ]
  },
  
  "availability": {
    "status": "in_stock",
    "quantity_available": 4500,
    "lead_time_days": 7,
    "minimum_order_quantity": 500
  },
  
  "verification_tier": "fully_verified",
  
  "nafta_tracking_enabled": true,
  "nafta_qualification_status": "qualifies",
  "north_american_percentage": 100.00
}
```

---

## 3.3 NAFTA/CUSMA AUTOMATION

### What It Does

**Problem:** Manufacturers spend 8-12 hours per product tracking NAFTA content in Excel.

**Solution:** Automated input-by-input tracking with one-click Certificate of Origin generation.

---

### Key Features

**1. Input-by-Input Tracking**
- Track every input: materials, labor, overhead, packaging
- Country of origin (ISO 3166-1 alpha-3 codes)
- Cost per unit, quantity
- Supplier declarations (optional upload)

**2. Automatic RVC Calculation**
```python
RVC = (North American Cost / Total Cost) × 100%

Example:
  Total: $1.15
  NAFTA (CAN + USA + MEX): $1.15
  RVC = 100%
  Threshold: 60%
  Status: ✅ QUALIFIES
```

**3. CBSA Form B232 Generation**
- Pre-filled Certificate of Origin
- Preference criterion auto-detected (A, B, C, D, E, F)
- PDF download + supporting docs package (ZIP)

**4. Odoo ERP Integration (Phase 2)**
- Sync Bill of Materials → NAFTA inputs
- Recursive BOM extraction (multi-level subassemblies)
- Labor from routing, overhead allocation

---

### User Workflow

```
1. Seller enables NAFTA tracking on DPP
2. Seller adds inputs:
   - Raw materials (country, cost, supplier)
   - Direct labor (Canada, $0.35)
   - Overhead (Canada, $0.18)
3. System auto-calculates RVC
4. System displays: "✅ QUALIFIES (100% NAFTA)"
5. Seller clicks "Generate Certificate"
6. System creates CBSA Form B232 PDF
7. Seller downloads, signs, ships with product
```

---

## 3.4 AI-POWERED INTELLIGENT MATCHING

### What It Does

**Problem:** Traditional marketplaces only match keywords. Buyer searches "stainless steel 1500F" and doesn't know better alternatives exist.

**Solution:** AI understands application context, detects performance gaps, recommends superior materials with TCO analysis.

---

### Key Features

**1. Contextual Understanding (NLP)**
- Extract: Material, application, temperature, constraints
- Example: "stainless steel high temperature exhaust 1500F"
  - Material: 321 Stainless Steel (implied)
  - Application: Automotive exhaust
  - Temperature: 1,500°F
  - Environment: High-temp oxidation

**2. Performance Gap Detection**
- Lookup material properties (max temp, oxidation resistance, creep strength)
- Calculate safety margin: Max Temp - Target Temp
- Example: 321 SS max = 1,500°F, target = 1,500°F → **0°F margin (CRITICAL)**

**3. Alternative Material Recommendations**
- Search technical library for superior alternatives
- Filter by marketplace availability (in stock)
- Rank by: Temperature margin (40%), Cost (30%), Availability (15%), Familiarity (10%), Service life (5%)

**4. Total Cost of Ownership (TCO) Calculator**
- Compare: Initial cost, service life, replacement frequency
- Example: 321 SS vs. Inconel 600
  - 321 SS: $29,700 initial, 2-year life, 5× replacements = $214,670 TCO (10 years)
  - Inconel 600: $53,550 initial, 5-year life, 2× replacements = $136,260 TCO (10 years)
  - **Savings: $78,410**

**5. Seller Outreach Automation**
- Alert seller when AI recommends their material
- Lead quality score (0-100): Hot (80+), Warm (60-79), Cold (<60)
- Email template: "Qualified lead: Inconel 600 for automotive exhaust"

---

### Example (Scenario #11)

**User Query:** "stainless steel high temperature exhaust 1500F"

**AI Processing:**
1. **Understands context:** Automotive exhaust, 1,500°F continuous, implied 321 SS
2. **Detects gap:** 321 SS max = 1,500°F → **ZERO safety margin**
3. **Searches library:** Find materials with max temp ≥ 1,600°F, suitable for exhaust
4. **Finds alternatives:** Inconel 600 (max 2,150°F), Inconel 625 (max 1,800°F), 309 SS (max 1,850°F)
5. **Checks marketplace:** Inconel 600 → 3 suppliers in stock (Grand River Alloys, etc.)
6. **Calculates TCO:** $78,410 savings over 10 years
7. **Ranks:** Inconel 600 = 0.91 score (excellent fit)
8. **Displays recommendation card:**

```
┌────────────────────────────────────────────────────────────┐
│ 💡 AI Recommendation: Consider Inconel 600                │
│                                                            │
│ Your search suggests 321 stainless at 1,500°F.           │
│ This material has ZERO safety margin.                     │
│                                                            │
│ ✓ Inconel 600 rated to 2,150°F (+650°F margin)           │
│ ✓ 2-3× longer service life                               │
│ ✓ Save $78K over 10 years (despite higher $/lb)          │
│                                                            │
│ 3 suppliers available:                                    │
│ • Grand River Alloys (Cambridge, ON) - In stock          │
│                                                            │
│ [View TCO Analysis] [See Suppliers] [Dismiss]             │
└────────────────────────────────────────────────────────────┘
```

---

## 3.5 SEARCH & DISCOVERY

### Search Functionality

**1. Keyword Search**
- Full-text search (PostgreSQL pg_trgm)
- Search across: Asset name, description, material, supplier
- Autocomplete suggestions

**2. Filters**
- Asset type (Equipment, Material, Part, Service)
- Verification tier (Basic, Document-Supported, Fully Verified)
- NAFTA qualification (Qualifies, Does Not Qualify)
- Location (city, province, distance radius)
- Price range
- Availability (In Stock, Made to Order)

**3. Sort Options**
- Relevance (default)
- Price (low to high, high to low)
- Distance (nearest first)
- Newest listings
- Most viewed

---

### Example Search Query

```
POST /api/v1/search
{
  "query": "stainless steel",
  "filters": {
    "asset_type": ["raw_material"],
    "verification_tier": ["fully_verified"],
    "nafta_qualifies": true,
    "location": {
      "province": "ON",
      "max_distance_km": 100
    },
    "availability": "in_stock"
  },
  "sort": "relevance",
  "page": 1,
  "per_page": 20
}
```

---

## 3.6 VERIFICATION & TRUST SYSTEM

### 4-Tier Verification System

**Tier 1: Basic (Free)**
- Self-declared data
- No documentation required
- Badge: "Basic"

**Tier 2: Document-Supported (Automatic Upgrade)**
- One validated formal document (mill cert, calibration cert, capability statement)
- AI validates: Document type, key data extracted, cross-checks against DPP
- Badge: "Document-Supported" (green checkmark)

**Tier 3: Fully Verified (Manual Review)**
- Complete documentation set:
  - Material certifications (mill certs, chemical composition)
  - Quality documentation (PPAP, dimensional inspection, ISO certs)
  - NAFTA tracking (input-by-input, Certificate of Origin)
- Admin reviews and approves
- Badge: "Fully Verified" (gold star)

**Tier 4: Third-Party Certified (Phase 2)**
- Independent inspection report (MachineCheck Canada, Bureau Veritas, etc.)
- Equipment condition rating (1-5 stars)
- Badge: "Third-Party Certified" (platinum shield)

---

### Auto-Upgrade Logic (Tier 1 → Tier 2)

```python
def check_auto_upgrade_to_tier_2(dpp_id):
    """
    Automatically upgrade DPP to Tier 2 if formal doc validated
    """
    dpp = DPP.objects.get(dpp_id=dpp_id)
    
    # Get all validated documents
    validated_docs = Document.objects.filter(
        dpp_id=dpp_id,
        validation_status='validated',
        document_type__in=['mill_cert', 'calibration_cert', 'capability_statement', ...]
    )
    
    if validated_docs.count() >= 1:
        # At least one formal doc → Upgrade to Tier 2
        dpp.verification_tier = 'document_supported'
        dpp.save()
        
        # Create audit trail
        VerificationHistory.objects.create(
            dpp_id=dpp_id,
            previous_tier='basic',
            new_tier='document_supported',
            verification_date=now(),
            reviewer_id=None,  # Automatic
            notes='Auto-upgraded: 1 validated formal document'
        )
        
        # Notify seller
        send_email(
            to=dpp.seller.email,
            subject="Your listing was upgraded to Document-Supported!",
            body="Congrats! Your DPP now has a green checkmark badge."
        )
```

---

---

# PART 4: KEY TECHNICAL PREMISES

---

## 4.1 ARCHITECTURE DECISIONS

### Decision 1: Modular Monolith (Not Microservices)

**Rationale:**
- ✅ Faster MVP development (single codebase, shared DB)
- ✅ Lower infrastructure costs (no inter-service communication overhead)
- ✅ Simpler debugging (unified logging, single stack trace)
- ✅ Future-proof (modules can be extracted later if needed)

**Trade-off:**
- ❌ Can't scale individual services independently (but not needed at MVP scale)

---

### Decision 2: PostgreSQL with JSONB (Not NoSQL)

**Rationale:**
- ✅ ACID transactions (critical for marketplace)
- ✅ JSONB flexibility (`core_attributes` vary by asset type)
- ✅ Powerful querying (join JSONB with relational data)
- ✅ Full-text search (pg_trgm), geospatial (PostGIS)

**Trade-off:**
- ❌ More complex schema design vs. MongoDB (but worth it for data integrity)

---

### Decision 3: Django REST Framework (Not Node.js)

**Rationale:**
- ✅ Batteries included (ORM, admin panel, auth)
- ✅ Strong PostgreSQL ORM (complex queries for NAFTA)
- ✅ Mature ecosystem (packages for everything)
- ✅ Team expertise (Python more common in manufacturing/engineering)

**Alternative:** Node.js + Express equally valid (TypeScript end-to-end)

---

### Decision 4: GPT-4 API for NLP (Not Custom Models) - MVP

**Rationale:**
- ✅ Fastest time to market (no training data needed)
- ✅ High accuracy out of box (state-of-the-art NLP)
- ✅ Flexible (easy to iterate on prompts)

**Trade-off:**
- ❌ API costs ($0.03 per 1K tokens → ~$0.10 per search)
- ❌ External dependency (latency, rate limits)

**Phase 2 Plan:** Train custom models (spaCy, Hugging Face) once we have labeled data from user feedback

---

### Decision 5: JWT for Authentication (Not Sessions)

**Rationale:**
- ✅ Stateless (no server-side session storage)
- ✅ Scalable (works across multiple API servers)
- ✅ Mobile-friendly (easy token management)

**Implementation:**
- Access token: 24-hour expiry
- Refresh token: 30-day expiry
- Token rotation on refresh

---

## 4.2 DATABASE DESIGN PHILOSOPHY

### Principle 1: Normalize Core Data, Denormalize for Performance

**Normalized:**
- User accounts, DPPs, NAFTA inputs (separate tables)
- Proper foreign keys, referential integrity

**Denormalized (Strategic):**
- `nafta_content` stores calculated values (`north_american_percentage`, `rvc_qualification_status`)
- Speeds up search queries ("show me all qualifying products")
- Recalculated on input changes (eventual consistency acceptable)

---

### Principle 2: JSONB for Flexibility, Not as a Crutch

**Good Use of JSONB:**
- `core_attributes` (varies by asset type: Equipment has `hours`, Material has `grade`)
- `extracted_data` (AI output structure unknown upfront)
- `pricing.volume_tiers` (array of objects, variable length)

**Bad Use of JSONB:**
- Don't store critical search fields in JSONB (use regular columns + indexes)
- Don't use JSONB to avoid thinking about schema

---

### Principle 3: Soft Deletes for Audit Trail

**Implementation:**
```python
class DPP(models.Model):
    # ... fields
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    def delete(self, *args, **kwargs):
        """Soft delete"""
        self.deleted_at = timezone.now()
        self.save()
    
    @classmethod
    def active_objects(cls):
        """Manager for non-deleted objects"""
        return cls.objects.filter(deleted_at__isnull=True)
```

**Rationale:**
- NAFTA records must be kept 6 years (CBSA requirement)
- Audit trail for dispute resolution
- Can recover accidentally deleted data

---

## 4.3 API DESIGN PRINCIPLES

### Principle 1: RESTful with Pragmatism

**Follow REST conventions:**
- GET /api/v1/dpp/finished_part → List
- GET /api/v1/dpp/finished_part/{id} → Retrieve
- POST /api/v1/dpp/finished_part → Create
- PUT /api/v1/dpp/finished_part/{id} → Replace
- PATCH /api/v1/dpp/finished_part/{id} → Partial update
- DELETE /api/v1/dpp/finished_part/{id} → Delete

**But deviate when needed:**
- POST /api/v1/nafta/{id}/calculate → Trigger calculation (not strictly REST, but clear)
- POST /api/v1/search → Search with complex filters (POST body more flexible than GET query params)

---

### Principle 2: Versioned API (v1, v2, ...)

**URL Structure:** `https://api.fabie.ca/v1/...`

**Rationale:**
- Breaking changes inevitable (new DPP fields, RVC threshold changes)
- v1 supported for 12-18 months after v2 release
- Gradual migration, no forced breaking changes

---

### Principle 3: Consistent Error Responses

**Standard Error Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {"field": "cost_per_unit", "message": "Must be greater than 0"},
      {"field": "country_of_origin", "message": "Invalid country code: XYZ"}
    ],
    "timestamp": "2025-12-30T14:30:00Z"
  }
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 204: No Content (successful DELETE)
- 400: Bad Request (validation error)
- 401: Unauthorized (not logged in)
- 403: Forbidden (logged in, but insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate resource)
- 422: Unprocessable Entity (semantic error)
- 429: Too Many Requests (rate limited)
- 500: Internal Server Error
- 503: Service Unavailable (maintenance mode)

---

## 4.4 SECURITY & COMPLIANCE

### Authentication & Authorization

**1. Authentication (Who are you?)**
- JWT tokens (access + refresh)
- Password hashing: bcrypt (Django default: PBKDF2)
- Email verification required
- 2FA optional (Phase 2)

**2. Authorization (What can you do?)**
- Role-Based Access Control (RBAC)
- Roles: Buyer, Seller, Admin
- Resource-level permissions (can edit own DPPs, not others')

---

### Data Protection

**1. Personal Data (PIPEDA Compliance - Canada)**
- Minimal data collection (name, email, company, phone)
- User consent for marketing communications
- Right to access, correct, delete data
- Data retention: 7 years (exceeds CBSA 6-year requirement)

**2. Encryption**
- In transit: HTTPS/TLS 1.3 (all API traffic)
- At rest: AWS RDS encryption (AES-256)
- Sensitive fields: Not storing credit cards (Stripe handles payments - Phase 2)

**3. Access Control**
- S3 documents: Private by default, pre-signed URLs (1-hour expiry)
- Photos: Public (CloudFront CDN)
- API: Rate limiting (100 req/min per user)

---

### Audit Trail

**What We Log:**
- User actions: Login, logout, DPP create/update/delete
- NAFTA calculations: Input changes, RVC recalculations
- Verification actions: Admin approvals, tier upgrades
- Certificate generation: Who, when, what data

**Retention:**
- Application logs: 90 days (CloudWatch)
- Audit trail: 7 years (database)
- NAFTA records: Permanent (soft delete only)

---

## 4.5 PERFORMANCE REQUIREMENTS

### Latency Targets

**API Response Times (p95):**
- GET /dpp/{id} (single): <200ms
- GET /search (20 results): <500ms
- POST /dpp (create): <1s
- POST /nafta/calculate (RVC): <500ms
- AI recommendation: <2s (includes GPT-4 API call)

**Page Load Times:**
- Homepage: <2s (First Contentful Paint)
- Search results: <2s
- DPP detail page: <2s

---

### Scalability Targets

**Year 1 (MVP):**
- 1,000 sellers
- 5,000 buyers
- 10,000 DPPs
- 100 concurrent users
- 10K API requests/day

**Year 2 (Growth):**
- 5,000 sellers
- 25,000 buyers
- 50,000 DPPs
- 500 concurrent users
- 100K API requests/day

**Architecture Scaling:**
- Horizontal scaling (add more API servers)
- Database read replicas (search queries)
- Redis caching (common searches)
- CDN (photos, static assets)

---

### Availability & Reliability

**SLA Targets:**
- Uptime: 99.5% (4.3 hours downtime/year)
- Data durability: 99.999% (RDS automated backups)
- RTO (Recovery Time Objective): <4 hours
- RPO (Recovery Point Objective): <24 hours

**Strategies:**
- Multi-AZ RDS deployment (automatic failover)
- Load balancer health checks (auto-remove unhealthy servers)
- Automated backups (daily snapshots, 30-day retention)
- Blue-green deployment (zero-downtime releases)

---

---

# PART 5: MVP VS. PHASE 2

---

## 5.1 MVP SCOPE (MONTHS 1-7)

### What We're Building

**Timeline:** 15 sprints × 2 weeks = 30 weeks (~7 months)  
**Team:** 8 people (1 PM, 1 tech lead, 2 BE devs, 2 FE devs, 1 AI/ML, 1 DevOps, 1 QA, 1 UI/UX)  
**Budget:** $600K-$850K  

---

### Sprint Breakdown

**Sprints 1-2: Foundation (4 weeks)**
- User authentication (registration, login, password reset)
- Basic dashboard (buyer/seller views)
- Database setup (PostgreSQL, migrations)
- UI framework (React, Tailwind, components)
- AWS infrastructure (EC2/ECS, RDS, S3, CloudFront)

**Sprints 3-4: DPP Creation (4 weeks)**
- Create DPP forms (4 asset types: Equipment, Material, Part, Service)
- Photo upload (primary + gallery)
- Document upload (mill certs, calibration reports, etc.)
- Edit/delete DPPs
- QR code generation

**Sprints 5-6: Search & Discovery (4 weeks)**
- Search implementation (PostgreSQL full-text + filters)
- Search results page (listing cards, pagination)
- DPP detail page (photo gallery, specs, contact seller)
- Watchlist (save listings)
- Messaging (seller-buyer inquiries)

**Sprints 7-8: NAFTA & Verification (4 weeks)**
- NAFTA input management (add/edit/delete inputs)
- RVC calculation engine
- Country breakdown visualization (pie chart + table)
- Qualification status display
- Verification tier logic (auto-upgrade to Tier 2)
- Admin dashboard (verification queue)

**Sprints 9-10: Document Processing (4 weeks)**
- AI document classification (mill cert, calibration cert, etc.)
- OCR (AWS Textract integration)
- Data extraction (key fields from documents)
- Validation logic (cross-check against DPP)
- Document status display

**Sprints 11-12: Polish & Testing (4 weeks)**
- Bug fixes (priority P0, P1)
- Performance optimization (caching, query optimization)
- Load testing (simulate 100 concurrent users)
- Security audit (penetration testing)
- Accessibility (WCAG 2.1 AA compliance)

**Sprints 13-15: Beta & Launch (6 weeks)**
- **Sprint 13:** Beta testing (20 beta users, feedback collection)
- **Sprint 14:** Marketing prep (content creation, CME partnership activation)
- **Sprint 15:** MVP launch (production deployment, monitoring, user support)

---

### MVP Success Criteria

**Metrics (6 months post-launch):**
- 1,000 sellers registered
- 5,000 buyers registered
- 3,000 DPPs created
- 500 DPPs with Tier 2+ verification
- 50 Certificates of Origin generated
- 100 transactions completed

**Technical:**
- 99.5% uptime
- <2s page load times
- <500ms API response times (p95)
- Zero critical security vulnerabilities

---

## 5.2 PHASE 2 ENHANCEMENTS (MONTHS 8-18)

### Advanced Features

**1. AI Matching Enhancements (Months 8-10)**
- Material upgrade recommendations (Scenario #11 full implementation)
- TCO calculator (user-configurable assumptions, sensitivity analysis)
- Seller outreach automation (lead scoring, email templates)
- Estimated effort: 60 story points

**2. Odoo ERP Integration (Months 9-12)**
- Odoo Connector Module (fabie_connector)
- BOM sync wizard (recursive extraction)
- Labor from routing (work center costs)
- Overhead allocation (configurable methods)
- Estimated effort: 55 story points

**3. Advanced Search (Months 8-9)**
- Map view (geographic clustering)
- Saved searches (email alerts when new listings match)
- Comparison tool (compare 2-3 DPPs side-by-side)
- Estimated effort: 35 story points

**4. Third-Party Inspections (Months 11-13)**
- Tier 4 verification (independent inspection reports)
- Integration with inspection companies (MachineCheck Canada, Bureau Veritas)
- Equipment condition rating (1-5 stars)
- Estimated effort: 40 story points

**5. Transactional Features (Months 14-18)**
- Escrow service (secure payments)
- Smart contracts (blockchain-based, Ethereum/Polygon)
- Transaction history
- Estimated effort: 80 story points

**6. Mobile Apps (Months 12-18)**
- iOS app (Swift/SwiftUI or React Native)
- Android app (Kotlin or React Native)
- Offline mode (view cached listings)
- Push notifications (new inquiries, price drops)
- Estimated effort: 120 story points

---

## 5.3 FUTURE VISION (MONTHS 19+)

### Year 2-3 Roadmap

**1. Advanced Analytics**
- Predictive pricing (market trends, demand forecasting)
- Supplier scorecards (quality, delivery, responsiveness)
- Industry benchmarking (compare your prices to market)

**2. Supply Chain Intelligence**
- Price trend analysis ("304L stainless down 5% last 30 days")
- Lead time optimization ("Supplier A: 2 weeks, Supplier B: 8 weeks")
- Inventory optimization (reorder point alerts)

**3. Process Optimization Recommendations**
- AI suggests better manufacturing processes ("use forging instead of casting for 20% strength gain")
- Welding method comparison (laser vs. TIG)
- Surface finish recommendations

**4. Collaborative Features**
- Shared workspaces (team purchasing)
- Approval workflows (manager approval for >$10K purchases)
- Collaborative RFQs (multiple buyers combine orders for volume discounts)

**5. Marketplace Expansion**
- Freight/logistics coordination (integrated shipping quotes)
- Financing facilitation (purchase order financing, equipment leasing)
- Insurance (liability, cargo)

---

---

# PART 6: GETTING STARTED

---

## 6.1 DOCUMENT NAVIGATION GUIDE

You now have **7 comprehensive documents** (570+ pages). Here's how to navigate them:

---

### Document Map

```
┌─────────────────────────────────────────────────────────────┐
│         START HERE: README_FIRST (This Document)            │
│  • Project overview, architecture, tech stack, roadmap      │
└─────────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────┴────────────────────┐
         ↓                                         ↓
┌──────────────────────────┐       ┌──────────────────────────┐
│  QUICK REFERENCE TOOLS   │       │   CORE DOCUMENTATION     │
├──────────────────────────┤       ├──────────────────────────┤
│ 2. Scenario Index (CSV)  │       │ 1. Business Scenarios    │
│    • 11 scenarios         │       │    Compendium (~100 pg) │
│    • Comprehensive +      │       │    • 11 complete         │
│      Simplified versions  │       │      scenarios           │
│                          │       │    • DPP templates       │
│ 3. Document Type Catalog │       │    • NAFTA framework     │
│    (CSV)                 │       │    • AI matching         │
│    • 21 document types   │       │                          │
│    • AI processing reqs  │       │ 4. DPP Technical Spec    │
│                          │       │    (~70 pg)              │
│                          │       │    • Data schemas        │
│                          │       │    • NAFTA model         │
│                          │       │    • Verification tiers  │
│                          │       │    • API specs           │
│                          │       │                          │
│                          │       │ 5. MVP Design Scope      │
│                          │       │    (~100 pg)             │
│                          │       │    • Architecture        │
│                          │       │    • User stories        │
│                          │       │    • Database design     │
│                          │       │    • API endpoints       │
│                          │       │    • Roadmap             │
└──────────────────────────┘       └──────────────────────────┘
                              ↓
         ┌────────────────────┴────────────────────┐
         ↓                                         ↓
┌──────────────────────────┐       ┌──────────────────────────┐
│ STRATEGIC SPECS          │       │                          │
├──────────────────────────┤       │                          │
│ 6. AI Matching Logic     │       │                          │
│    (~80 pg)              │       │                          │
│    • NLP requirements    │       │                          │
│    • Material upgrades   │       │                          │
│    • TCO calculation     │       │                          │
│    • Recommendation      │       │                          │
│      engine              │       │                          │
│                          │       │                          │
│ 7. NAFTA/CUSMA           │       │                          │
│    Automation (~75 pg)   │       │                          │
│    • Input tracking      │       │                          │
│    • RVC algorithms      │       │                          │
│    • CBSA Form B232      │       │                          │
│    • Odoo integration    │       │                          │
└──────────────────────────┘       └──────────────────────────┘
```

---

## 6.2 READING PATH BY ROLE

### For Backend Developers

**Week 1:**
1. ✅ **README_FIRST** (this document) - 35 min
2. **MVP Design Scope & Specifications** (Deliverable 5)
   - Section 2: System Architecture (30 min)
   - Section 4: Database Design (45 min)
   - Section 5: API Design (1 hour)

**Week 2:**
3. **DPP Technical Specification** (Deliverable 4)
   - Section 2: Data Schemas (1 hour)
   - Section 5: NAFTA Tracking (1 hour)

**Week 3:**
4. **NAFTA/CUSMA Automation Specification** (Deliverable 7)
   - Section 2: Data Model (45 min)
   - Section 4: RVC Calculation Engine (1 hour)
   - Section 4.4: Code Implementation (1 hour)

**As Needed:**
5. **AI Matching Logic Specification** (Deliverable 6) - If working on AI features

---

### For Frontend Developers

**Week 1:**
1. ✅ **README_FIRST** (this document) - 35 min
2. **MVP Design Scope & Specifications** (Deliverable 5)
   - Section 2: System Architecture (30 min)
   - Section 5: API Design (1 hour) - Understand API contracts
   - Section 6: Frontend Design (1 hour)

**Week 2:**
3. **DPP Technical Specification** (Deliverable 4)
   - Section 6: UI Component Specs (45 min)
   - Section 2: Data Schemas (30 min) - Understand data structures

**Week 3:**
4. **NAFTA/CUSMA Automation Specification** (Deliverable 7)
   - Section 8: User Interface (1 hour) - NAFTA UI mockups

**As Needed:**
5. **Business Scenarios Compendium** (Deliverable 1) - For understanding user workflows

---

### For AI/ML Engineers

**Week 1:**
1. ✅ **README_FIRST** (this document) - 35 min
2. **AI Matching Logic Specification** (Deliverable 6) - **READ IN FULL** (3-4 hours)
   - This is your primary spec document

**Week 2:**
3. **Document Type Catalog** (Deliverable 3) - 30 min
   - Understand AI processing requirements per document type

4. **NAFTA/CUSMA Automation Specification** (Deliverable 7)
   - Section 5: Supplier Declarations (45 min) - AI extraction logic

**Week 3:**
5. **Business Scenarios Compendium** (Deliverable 1)
   - Scenario #11 (30 min) - AI material upgrade example

---

### For Product Managers

**Week 1:**
1. ✅ **README_FIRST** (this document) - 35 min
2. **Business Scenarios Compendium** (Deliverable 1) - **READ IN FULL** (2-3 hours)
   - Understand user workflows, pain points, value propositions

**Week 2:**
3. **MVP Design Scope & Specifications** (Deliverable 5)
   - Section 1: Executive Summary (30 min)
   - Section 3: User Stories & Personas (1 hour)
   - Section 4: Feature Requirements Matrix (1 hour)
   - Section 10: Development Roadmap (1 hour)

**Week 3:**
4. **Scenario Index** (Deliverable 2) - 15 min
   - Quick reference for all scenarios

5. **DPP Technical Specification** (Deliverable 4)
   - Section 1: Overview (30 min)

---

### For QA Engineers

**Week 1:**
1. ✅ **README_FIRST** (this document) - 35 min
2. **MVP Design Scope & Specifications** (Deliverable 5)
   - Section 3: User Stories (1 hour) - Test scenarios
   - Section 5: API Design (1 hour) - API test cases

**Week 2:**
3. **Business Scenarios Compendium** (Deliverable 1)
   - Skim all scenarios (1 hour) - End-to-end test cases

4. **NAFTA/CUSMA Automation Specification** (Deliverable 7)
   - Section 9.2: Testing Strategy (30 min)

**Week 3:**
5. Create test plans based on user stories

---

## 6.3 DEVELOPMENT WORKFLOW

### Git Workflow (Gitflow)

```
main (production)
  └─ develop (integration)
       ├─ feature/dpp-creation
       ├─ feature/nafta-calculation
       ├─ feature/ai-matching
       └─ bugfix/search-timeout
```

**Branch Naming:**
- `feature/` - New features (e.g., `feature/dpp-creation`)
- `bugfix/` - Bug fixes (e.g., `bugfix/search-timeout`)
- `hotfix/` - Production hotfixes (e.g., `hotfix/security-patch`)
- `release/` - Release branches (e.g., `release/v1.0.0`)

**PR Process:**
1. Developer creates feature branch from `develop`
2. Implement feature, write tests
3. Open PR to `develop`
4. Code review (1 approval required)
5. CI/CD runs tests, linters
6. Merge to `develop`
7. Weekly merge `develop` → `main` (production release)

---

### CI/CD Pipeline

```
[Git Push]
    ↓
[GitHub Actions Triggered]
    ↓
┌─────────────────────────┐
│ 1. Lint & Format Check  │
│    • Python: flake8     │
│    • JS/TS: ESLint      │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ 2. Run Unit Tests       │
│    • pytest (Python)    │
│    • Jest (JS/TS)       │
│    • Coverage: >80%     │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ 3. Build Docker Image   │
│    • Multi-stage build  │
│    • Tag: commit SHA    │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ 4. Push to ECR          │
│    • AWS ECR registry   │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ 5. Deploy to Staging    │
│    • ECS task update    │
│    • Run E2E tests      │
└─────────────────────────┘
    ↓ (Manual Approval)
┌─────────────────────────┐
│ 6. Deploy to Production │
│    • Blue-green deploy  │
│    • Gradual rollout    │
│    • Monitor metrics    │
└─────────────────────────┘
```

---

### Code Review Checklist

**Functionality:**
- [ ] Feature works as specified in user story
- [ ] Edge cases handled (null values, empty arrays, etc.)
- [ ] Error handling implemented (try/catch, validation)

**Code Quality:**
- [ ] Follows project style guide (linter passes)
- [ ] No code duplication (DRY principle)
- [ ] Functions are small, focused (<50 lines)
- [ ] Variable names are descriptive

**Testing:**
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests if applicable
- [ ] Manual testing performed

**Security:**
- [ ] No hardcoded secrets (API keys, passwords)
- [ ] Input validation (SQL injection, XSS prevention)
- [ ] Authorization checks (user can only access own data)

**Performance:**
- [ ] No N+1 queries (Django: `select_related`, `prefetch_related`)
- [ ] Database indexes added for new query patterns
- [ ] Large files handled asynchronously (Celery tasks)

**Documentation:**
- [ ] API changes documented (OpenAPI spec updated)
- [ ] README updated if setup changes
- [ ] Inline comments for complex logic

---

## 6.4 KEY CONTACTS

### Project Team

**Product & Business:**
- **Project Lead:** Shiva Tiwari (shiva@fewastudio.com)
- **Product Manager:** [TBD]

**Engineering:**
- **Tech Lead:** [TBD]
- **Backend Lead:** [TBD]
- **Frontend Lead:** [TBD]
- **AI/ML Lead:** [TBD]
- **DevOps Lead:** [TBD]

**Design & QA:**
- **UI/UX Designer:** [TBD]
- **QA Lead:** [TBD]

---

### Communication Channels

**Slack:**
- `#fabie-general` - General project discussion
- `#fabie-dev` - Development team (backend, frontend, AI)
- `#fabie-standup` - Daily standup updates
- `#fabie-deployments` - Deployment notifications
- `#fabie-bugs` - Bug reports and triage

**Weekly Meetings:**
- **Monday 9:00 AM:** Sprint Planning (2 hours)
- **Daily 9:30 AM:** Standup (15 min)
- **Friday 4:00 PM:** Sprint Demo & Retrospective (1 hour)

**Project Management:**
- **Tool:** Jira / Linear / GitHub Projects
- **Sprint Length:** 2 weeks
- **Velocity:** 20 story points per sprint (8-person team)

---

---

# CONCLUSION

---

## 🎉 You're Ready to Build!

You've completed the **README_FIRST** onboarding. You now understand:

✅ **What Fabie is** - AI-powered manufacturing marketplace with NAFTA automation  
✅ **The architecture** - Three-tier modular monolith, PostgreSQL + JSONB, Django/React  
✅ **The tech stack** - Python/TypeScript, AWS, GPT-4 API, Redis, S3  
✅ **What's deferred** - AI matching enhancements, Odoo integration, mobile apps (Phase 2)  
✅ **Where to go next** - Reading paths by role, detailed specs in other documents  

---

## 📚 Next Steps by Role

**Backend Developers:** Read MVP Design Scope (Deliverable 5) → DPP Technical Spec (Deliverable 4) → Start on Sprint 1 (Auth)

**Frontend Developers:** Read MVP Design Scope (Deliverable 5) → Frontend Design section → Start on Sprint 1 (UI framework)

**AI/ML Engineers:** Read AI Matching Logic Specification (Deliverable 6) in full → Build NLP processor

**Product Managers:** Read Business Scenarios Compendium (Deliverable 1) → User stories → Backlog grooming

**QA Engineers:** Read User Stories → Create test plans → Set up test automation framework
