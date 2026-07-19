export const services = [
  {
    slug: "gpu-as-a-service",
    title: "GPU as a Service",
    shortText: "High-performance compute for AI, ML, rendering, and research workloads.",
    icon: "gpu",
    heroLabel: "Accelerated Compute",
    intro:
      "Elastic GPU infrastructure designed for training, simulation, rendering, and burst-heavy compute without the cost of managing hardware internally.",
    highlights: [
      "On-demand GPU capacity for AI, rendering, and simulation workloads",
      "Secure provisioning with monitored usage and environment setup",
      "Scalable clusters for research Team, agencies, and production pipelines",
    ],
    deliverables: [
      "Workload planning and GPU sizing",
      "Cluster provisioning and access setup",
      "Monitoring, uptime checks, and usage support",
      "Security, backup, and environment maintenance",
    ],
    outcomes: ["Faster experimentation", "Lower hardware overhead", "Better compute visibility"],
  },
  {
    slug: "digital-marketing",
    title: "Digital Marketing",
    shortText: "Blue-print growth systems, campaigns, SEO, and conversion strategy.",
    icon: "marketing",
    heroLabel: "Growth Systems",
    intro:
      "A strategy-led digital marketing service that combines content, campaign planning, SEO, analytics, and conversion thinking into one focused growth engine.",
    highlights: [
      "Campaign planning aligned with business goals and audience intent",
      "SEO, content systems, and reporting built for long-term traction",
      "Conversion-focused landing experiences and performance refinement",
    ],
    deliverables: [
      "Marketing strategy and channel plan",
      "SEO roadmap and content direction",
      "Campaign creative and launch support",
      "Monthly reporting with optimization actions",
    ],
    outcomes: ["Stronger visibility", "Higher-quality leads", "Clearer campaign reporting"],
  },
  {
    slug: "3d-printing",
    title: "3D Printing",
    shortText: "Concept-to-production visual manufacturing and prototyping.",
    icon: "printing",
    heroLabel: "Rapid Prototyping",
    intro:
      "Rapid prototyping and production-support workflows for Team that need physical concepts, test models, presentation pieces, or pre-manufacturing validation.",
    highlights: [
      "Fast iteration from concept to visual or functional prototype",
      "Support for presentation models, test parts, and production-ready samples",
      "Clean process guidance around material, finish, and print feasibility",
    ],
    deliverables: [
      "Model review and print-readiness checks",
      "Prototype planning and print execution",
      "Material and finish recommendations",
      "Iteration support for revised models",
    ],
    outcomes: ["Faster validation", "Reduced design friction", "Sharper physical presentations"],
  },
  {
    slug: "it-infrastructure",
    title: "IT Infrastructure",
    shortText: "Secure, scalable systems with management and uptime visibility.",
    icon: "infrastructure",
    heroLabel: "Secure Operations",
    intro:
      "Reliable IT infrastructure support for organizations that need stable systems, cleaner visibility, better uptime, and confident day-to-day operations.",
    highlights: [
      "Infrastructure planning with security and uptime in mind",
      "Monitoring, maintenance, and managed support workflows",
      "Scalable system organization for growing Team and services",
    ],
    deliverables: [
      "Infrastructure assessment and recommendations",
      "Monitoring and maintenance setup",
      "Security hardening and backup planning",
      "Operational support and issue response guidance",
    ],
    outcomes: ["Improved stability", "Safer operations", "More reliable support visibility"],
  },
];

export const serviceMap = Object.fromEntries(services.map((service) => [service.slug, service]));
