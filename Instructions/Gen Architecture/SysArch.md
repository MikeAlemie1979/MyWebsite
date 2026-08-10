**General Unified Architecture Guidelines  
**  
**Section 1:**

SDLC model: Modular Agile Iterative (MAI)  
Development Approach: Modular, Page By Page.

**Governance Rules (Highly Important):**

*   **No architectural or UIUX modification without approval.**
*   **Do not invent workflows or new design.**
*   **Prevent architectural, functional, and implementation drift.**

Default Application Layers:  
1- UIUX  
2- APIs  
3- Frontend  
4- Security & Compliance  
5- Final Host  
4- Authentication, if needed.  
5- Ai Orchestration if needed.  
6- Agents , if needed.  
7- Cashing and CDN.  
8- Load Balancing, Container and Kubernethes.  
9- Third Party tools and API connection, if needed.  
10- DataBase, If needed.  
11- Storage and Warehouse, if needed  
12- Bugs and Error handling and Messages.

  
AI Development Approach:

Ask to choose one of the following:

“Mode 1 — Single AI Development”

Either Claude Code or OpenAI Codex completes the full project independently.

“Mode 2 — Collaborative AI Development”

Claude Code and OpenAI Codex work collabratively and saving their progress log in  
**“\\Development\\Implementation\\Roadmap.md”.**

AI Responsibilities If Mode 2 is Selected:

Claude Code is for

*   Architecture
*   Planning
*   Project management
*   Test & Verification
*   Quality review
*   Integration
*   CI/CD
*   Architecture governance

OpenAI Codex is for

*   Software implementation
*   Code generation
*   UI/UX implementation
*   Asset generation
*   Coding assistance

Ask which layers are needed?  
\- Ducker container and Kybernetes techniques by default is not needed.  

**Tools collection:**

select from below by showing all in a checkbox:

  
FrontEnd: C#.net / ASP.net / Javascript / Node.js / React / Vue.js / Next.js / HTM / CSS/ Flutter Dart (for mobile). Could be multiple choice as well.  
Security: DDOS and MMAT guard.  
Authentication: RBAC / Azure EntraID /Amazon IAM / Win Active Directory / Local User / Login Pass / Oath / Code. Could be multiple choice as well.  
AI Platform and Orchestration: OpenAI Codex / Claude Code.  
Database: Ms.SQL Server 2019+/ Azure SQL Server / CosmosDB / MongoDB /Redis / Google Sheet / Ms. Ecxel 2019+. Could be multiple choice as well.  
Storage: Google Drive / Azure Blob Storage / OneDrive / Local Disk. Could be multiple choice as well.  
DevOps and CICD: Github / Azure Devops.  
Final Environment: Azure Cloud, Internet Web Host Provider, On-Prem Windows.  
Payment Processing: Stripe / Square / Helcim all ready to configure at the admin level.  
Location and Mapping: TomTom / Google Map.  
Phone, Messaging, Telegram, Whatsapp: Twilio, Plivo.  
Email and Meetings: Ms 365 / SMTP Email Service on the Internet host / Google/ Yahoo / Hotmail or combination. Could be multiple choice.  
\*If final host is selected as On-Prem Windows then an installable setup wizard package “Setup.Exe” is needed to be built as well.

**Ask for the tools and layers to come up with the layered architecture:**

1.  Info Collection:  
    What would be the final host?  
    Estimated Transactions Per Minute (TPM)?  
    Estimated concurrent users?  
    Could consider Container and Kubernetes?  
    Whats the DB/s Name?  
    
2.  General App story:

Read on “\\Instructions\\Epic\\AppStory.md” .

**Analyze for architectural blueprint and review your analysis.**

Now suggest the needed pages and wait for approval.  
Ask the full path od Dev folder?  
Generate a mermaid flowchart that indicates what layers are also do in: “\\Deployment\\”.

Ask to save all these with Graphify in “\\Deployment” .  
  
**Section 2:**  
UI/UX and Coding Workflow:

Follow the UI/UX/Code design from “\\Instructions\\Gen UI\\UIUX.md”.  
  
Tips:

*   Always consider the Roadmap.md to find which phase is done to pursue the rest.
*   Use \\Deployment as a temp folder or the folder to save the progress.
*   \\Sprints\\Website\\ will hold the site logo, clips and images.
*   Sprints\\Pages\\ will hold the design and images and clips related to each page.
*   Final deployable code files will be saved in: “\\Deployment”.