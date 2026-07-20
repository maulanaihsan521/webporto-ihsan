import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const existing = await db.user.findUnique({ where: { email: "admin@maulanaihsan.com" } });
  if (!existing) {
    const hashed = await bcrypt.hash("admin123", 10);
    await db.user.create({
      data: {
        email: "admin@maulanaihsan.com",
        name: "Maulana Ihsan Rohim",
        password: hashed,
        role: "ADMIN",
        bio: "Freelancer Digital Marketing & Financial Market Analyst",
      },
    });
    console.log("✅ Admin user created (admin@maulanaihsan.com / admin123)");
  }

  // Settings
  const settings = [
    { key: "site_name", value: "Maulana Ihsan Rohim", group: "GENERAL", type: "TEXT" },
    { key: "site_tagline", value: "Helping Businesses Grow Through Digital Marketing, Creative Content, Technology, and Financial Market Insights.", group: "GENERAL", type: "TEXT" },
    { key: "site_description", value: "Saya adalah seorang freelancer yang memiliki keahlian di bidang Digital Marketing, Social Media Management, Photo & Video Production, Video Editing, serta Financial Market Analysis. Dengan latar belakang pendidikan Sistem Informasi, saya menggabungkan kreativitas, teknologi, dan analisis data untuk membantu bisnis berkembang melalui strategi digital yang efektif dan konten visual berkualitas.", group: "GENERAL", type: "TEXT" },
    { key: "owner_name", value: "Maulana Ihsan Rohim", group: "PROFILE", type: "TEXT" },
    { key: "owner_profession", value: "Freelancer Digital Marketing | Social Media Specialist | Photo & Video Production | Video Editor | Financial Market Analyst | Information Systems Graduate", group: "PROFILE", type: "TEXT" },
    { key: "owner_email", value: "maulana.ihsan@gmail.com", group: "PROFILE", type: "TEXT" },
    { key: "owner_phone", value: "+6281234567890", group: "PROFILE", type: "TEXT" },
    { key: "owner_location", value: "Jakarta, Indonesia", group: "PROFILE", type: "TEXT" },
    { key: "owner_photo", value: "", group: "PROFILE", type: "IMAGE" },
    { key: "owner_cv", value: "", group: "PROFILE", type: "TEXT" },
    { key: "owner_vision", value: "Menjadi freelancer digital terkemuka yang mengintegrasikan kreativitas, teknologi, dan analisis data untuk memberikan dampak nyata bagi pertumbuhan bisnis klien di era digital.", group: "PROFILE", type: "TEXT" },
    { key: "owner_mission", value: "Memberikan solusi digital marketing yang efektif, konten visual berkualitas tinggi, serta insight pasar finansial yang akurat untuk membantu bisnis dan individu mencapai tujuan mereka.", group: "PROFILE", type: "TEXT" },
    { key: "owner_values", value: "Profesionalisme, Kreativitas, Integritas, Inovasi, Kolaborasi, Hasil-Oriented", group: "PROFILE", type: "TEXT" },
    { key: "owner_hobbies", value: "Photography, Videography, Trading, Reading, Traveling, Gaming", group: "PROFILE", type: "TEXT" },
    { key: "owner_languages", value: "Indonesia (Native), English (Professional)", group: "PROFILE", type: "TEXT" },
    { key: "social_github", value: "https://github.com/maulanaihsan", group: "SOCIAL", type: "TEXT" },
    { key: "social_linkedin", value: "https://linkedin.com/in/maulanaihsan", group: "SOCIAL", type: "TEXT" },
    { key: "social_instagram", value: "https://instagram.com/maulanaihsan", group: "SOCIAL", type: "TEXT" },
    { key: "social_facebook", value: "https://facebook.com/maulanaihsan", group: "SOCIAL", type: "TEXT" },
    { key: "social_tiktok", value: "https://tiktok.com/@maulanaihsan", group: "SOCIAL", type: "TEXT" },
    { key: "social_youtube", value: "https://youtube.com/@maulanaihsan", group: "SOCIAL", type: "TEXT" },
    { key: "social_whatsapp", value: "https://wa.me/6281234567890", group: "SOCIAL", type: "TEXT" },
    { key: "stat_projects", value: "120", group: "STATS", type: "TEXT" },
    { key: "stat_clients", value: "85", group: "STATS", type: "TEXT" },
    { key: "stat_certificates", value: "25", group: "STATS", type: "TEXT" },
    { key: "stat_articles", value: "60", group: "STATS", type: "TEXT" },
    { key: "stat_experience", value: "5", group: "STATS", type: "TEXT" },
    { key: "theme_accent", value: "#f59e0b", group: "THEME", type: "COLOR" },
    { key: "theme_animation_speed", value: "normal", group: "THEME", type: "TEXT" },
    { key: "seo_meta_title", value: "Maulana Ihsan Rohim — Digital Marketing & Financial Market Analyst", group: "SEO", type: "TEXT" },
    { key: "seo_meta_description", value: "Portfolio profesional Maulana Ihsan Rohim — Freelancer Digital Marketing, Social Media Specialist, Photo & Video Production, Video Editor, dan Financial Market Analyst.", group: "SEO", type: "TEXT" },
    { key: "seo_meta_keywords", value: "Maulana Ihsan Rohim, Digital Marketing, Social Media, Video Editor, Financial Market, Portfolio", group: "SEO", type: "TEXT" },
    { key: "map_embed", value: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31708.996785588243!2d106.84513!3d-6.2088!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e945e34b9d%3A0x5371bf0fdad786a2!2sJakarta!5e0!3m2!1sen!2sid!4v1700000000000", group: "GENERAL", type: "TEXT" },
    { key: "cookie_consent", value: "true", group: "GENERAL", type: "TEXT" },
    { key: "whatsapp_float", value: "true", group: "GENERAL", type: "TEXT" },
  ];

  for (const s of settings) {
    await db.setting.upsert({
      where: { key: s.key },
      create: s,
      update: {},
    });
  }
  console.log("✅ Settings seeded");

  // Categories
  const blogCats = ["Digital Marketing", "Social Media", "Financial Market", "Technology", "Photography", "Videography"];
  for (const c of blogCats) {
    await db.category.upsert({
      where: { slug: c.toLowerCase().replace(/\s+/g, "-") },
      create: { name: c, slug: c.toLowerCase().replace(/\s+/g, "-"), type: "BLOG" },
      update: {},
    });
  }

  const portfolioCats = ["Web Development", "Video Production", "Digital Marketing", "Photography", "Branding", "UI/UX Design"];
  for (const c of portfolioCats) {
    await db.category.upsert({
      where: { slug: c.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      create: { name: c, slug: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"), type: "PORTFOLIO" },
      update: {},
    });
  }

  const certCats = ["Digital Marketing", "Photography", "Video Editing", "Financial Market", "Web Development", "Data Analysis"];
  for (const c of certCats) {
    await db.category.upsert({
      where: { slug: "cert-" + c.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      create: { name: c, slug: "cert-" + c.toLowerCase().replace(/[^a-z0-9]+/g, "-"), type: "CERTIFICATE" },
      update: {},
    });
  }

  const galleryCats = ["Photography", "Videography", "Design", "Events", "Travel", "Portrait"];
  for (const c of galleryCats) {
    await db.category.upsert({
      where: { slug: "gal-" + c.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      create: { name: c, slug: "gal-" + c.toLowerCase().replace(/[^a-z0-9]+/g, "-"), type: "GALLERY" },
      update: {},
    });
  }
  console.log("✅ Categories seeded");

  // Services
  const services = [
    { title: "Digital Marketing", slug: "digital-marketing", icon: "Megaphone", color: "amber", description: "Strategi pemasaran digital terpadu untuk meningkatkan brand awareness dan konversi.", features: "Search Engine Optimization,Meta & Google Ads,Content Marketing,Email Marketing,Analytics & Reporting", order: 1 },
    { title: "Social Media Management", slug: "social-media-management", icon: "Share2", color: "rose", description: "Manajemen konten sosial media profesional untuk membangun engagement.", features: "Content Planning,Content Creation,Community Management,Influencer Outreach,Social Analytics", order: 2 },
    { title: "Photography", slug: "photography", icon: "Camera", color: "violet", description: "Jasa fotografi profesional untuk produk, event, dan personal branding.", features: "Product Photography,Event Coverage,Portrait,Food Photography,Aerial Photography", order: 3 },
    { title: "Videography", slug: "videography", icon: "Video", color: "cyan", description: "Produksi video berkualitas tinggi untuk berbagai kebutuhan.", features: "Corporate Video,Commercial,Documentary,Event Coverage,Drone Footage", order: 4 },
    { title: "Video Editing", slug: "video-editing", icon: "Film", color: "orange", description: "Editing video profesional dengan motion graphics dan color grading.", features: "Adobe Premiere Pro,After Effects,Color Grading,Motion Graphics,Sound Design", order: 5 },
    { title: "Website Development", slug: "website-development", icon: "Code2", color: "emerald", description: "Pengembangan website modern, cepat, dan SEO friendly.", features: "Next.js,React,Tailwind CSS,SEO Optimization,Responsive Design", order: 6 },
    { title: "UI/UX Design", slug: "ui-ux-design", icon: "PenTool", color: "fuchsia", description: "Desain antarmuka pengguna yang intuitif dan menarik.", features: "Figma,Prototyping,User Research,Design System,Wireframing", order: 7 },
    { title: "Financial Market Research", slug: "financial-market-research", icon: "TrendingUp", color: "green", description: "Analisis pasar finansial untuk investasi yang lebih cerdas.", features: "Technical Analysis,Fundamental Analysis,Risk Management,Market Research,Investment Strategy", order: 8 },
  ];
  for (const s of services) {
    await db.service.upsert({
      where: { slug: s.slug },
      create: s,
      update: {},
    });
  }
  console.log("✅ Services seeded");

  // Skills
  const skills = [
    { name: "Digital Marketing", category: "Digital Marketing", percentage: 92, level: "EXPERT", icon: "Megaphone" },
    { name: "SEO", category: "Digital Marketing", percentage: 88, level: "ADVANCED", icon: "Search" },
    { name: "Meta Ads", category: "Digital Marketing", percentage: 90, level: "EXPERT", icon: "Facebook" },
    { name: "Google Ads", category: "Digital Marketing", percentage: 87, level: "ADVANCED", icon: "Search" },
    { name: "Content Marketing", category: "Digital Marketing", percentage: 89, level: "ADVANCED", icon: "FileText" },
    { name: "Social Media Management", category: "Social Media", percentage: 93, level: "EXPERT", icon: "Share2" },
    { name: "Photography", category: "Photography", percentage: 90, level: "EXPERT", icon: "Camera" },
    { name: "Videography", category: "Videography", percentage: 88, level: "ADVANCED", icon: "Video" },
    { name: "Adobe Photoshop", category: "Design", percentage: 91, level: "EXPERT", icon: "Image" },
    { name: "Adobe Illustrator", category: "Design", percentage: 85, level: "ADVANCED", icon: "PenTool" },
    { name: "Adobe Premiere Pro", category: "Video Editing", percentage: 92, level: "EXPERT", icon: "Film" },
    { name: "Adobe After Effects", category: "Video Editing", percentage: 84, level: "ADVANCED", icon: "Clapperboard" },
    { name: "CapCut", category: "Video Editing", percentage: 95, level: "EXPERT", icon: "Scissors" },
    { name: "Canva", category: "Design", percentage: 96, level: "EXPERT", icon: "Palette" },
    { name: "Figma", category: "Design", percentage: 88, level: "ADVANCED", icon: "Figma" },
    { name: "HTML", category: "Development", percentage: 90, level: "ADVANCED", icon: "Code2" },
    { name: "CSS", category: "Development", percentage: 88, level: "ADVANCED", icon: "Paintbrush" },
    { name: "JavaScript", category: "Development", percentage: 85, level: "ADVANCED", icon: "SquareCode" },
    { name: "TypeScript", category: "Development", percentage: 82, level: "ADVANCED", icon: "FileCode" },
    { name: "React", category: "Development", percentage: 86, level: "ADVANCED", icon: "Atom" },
    { name: "Next.js", category: "Development", percentage: 84, level: "ADVANCED", icon: "Triangle" },
    { name: "Tailwind CSS", category: "Development", percentage: 90, level: "ADVANCED", icon: "Wind" },
    { name: "Node.js", category: "Development", percentage: 80, level: "INTERMEDIATE", icon: "Hexagon" },
    { name: "Express", category: "Development", percentage: 78, level: "INTERMEDIATE", icon: "Network" },
    { name: "PHP", category: "Development", percentage: 75, level: "INTERMEDIATE", icon: "Code" },
    { name: "Laravel", category: "Development", percentage: 76, level: "INTERMEDIATE", icon: "Layers" },
    { name: "Python", category: "Development", percentage: 80, level: "ADVANCED", icon: "Terminal" },
    { name: "MySQL", category: "Database", percentage: 85, level: "ADVANCED", icon: "Database" },
    { name: "PostgreSQL", category: "Database", percentage: 82, level: "ADVANCED", icon: "Database" },
    { name: "MongoDB", category: "Database", percentage: 78, level: "INTERMEDIATE", icon: "Database" },
    { name: "Prisma", category: "Database", percentage: 85, level: "ADVANCED", icon: "Boxes" },
    { name: "REST API", category: "Development", percentage: 84, level: "ADVANCED", icon: "Webhook" },
    { name: "Git", category: "Tools", percentage: 88, level: "ADVANCED", icon: "GitBranch" },
    { name: "GitHub", category: "Tools", percentage: 87, level: "ADVANCED", icon: "Github" },
    { name: "Docker", category: "Tools", percentage: 75, level: "INTERMEDIATE", icon: "Container" },
    { name: "Linux", category: "Tools", percentage: 80, level: "ADVANCED", icon: "Terminal" },
    { name: "Networking", category: "Tools", percentage: 78, level: "INTERMEDIATE", icon: "Network" },
    { name: "Technical Analysis", category: "Financial Market", percentage: 88, level: "ADVANCED", icon: "CandlestickChart" },
    { name: "Fundamental Analysis", category: "Financial Market", percentage: 85, level: "ADVANCED", icon: "Landmark" },
    { name: "Risk Management", category: "Financial Market", percentage: 90, level: "EXPERT", icon: "ShieldCheck" },
    { name: "Trading Psychology", category: "Financial Market", percentage: 86, level: "ADVANCED", icon: "Brain" },
    { name: "Data Visualization", category: "Data Analysis", percentage: 84, level: "ADVANCED", icon: "BarChart3" },
    { name: "Microsoft Excel", category: "Data Analysis", percentage: 92, level: "EXPERT", icon: "Table" },
    { name: "Power BI", category: "Data Analysis", percentage: 80, level: "ADVANCED", icon: "PieChart" },
  ];
  for (let i = 0; i < skills.length; i++) {
    const s = skills[i];
    await db.skill.upsert({
      where: { slug: s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      create: { ...s, slug: s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), order: i },
      update: {},
    });
  }
  console.log("✅ Skills seeded");

  // Experiences
  const experiences = [
    { company: "Freelance Digital Marketing", position: "Digital Marketing Specialist", location: "Remote", type: "FREELANCE", startDate: new Date("2023-01-01"), current: true, description: "Mengelola strategi digital marketing untuk berbagai klien dari berbagai industri. Menjalankan kampanye Meta Ads dan Google Ads, content marketing, serta SEO.", technologies: "Meta Ads, Google Ads, SEO, Google Analytics, Canva" },
    { company: "Creative Studio ID", position: "Photo & Video Producer", location: "Jakarta", type: "FULL_TIME", startDate: new Date("2022-03-01"), endDate: new Date("2022-12-31"), current: false, description: "Memproduksi konten visual untuk brand dan UMKM. Melakukan shooting, editing, dan color grading video.", technologies: "Adobe Premiere Pro, After Effects, Photoshop, Lightroom" },
    { company: "PT Digital Nusantara", position: "Social Media Specialist", location: "Jakarta", type: "FULL_TIME", startDate: new Date("2021-06-01"), endDate: new Date("2022-02-28"), current: false, description: "Mengelola akun social media klien, membuat content calendar, dan menjalankan kampanye konten.", technologies: "Canva, CapCut, Meta Business Suite, Hootsuite" },
    { company: "Finansialku Sekuritas", position: "Market Analyst Intern", location: "Jakarta", type: "INTERNSHIP", startDate: new Date("2020-09-01"), endDate: new Date("2021-05-31"), current: false, description: "Melakukan analisis teknikal dan fundamental saham. Membuat laporan pasar harian dan rekomendasi investasi.", technologies: "TradingView, Microsoft Excel, Power BI" },
  ];
  for (let i = 0; i < experiences.length; i++) {
    await db.experience.create({ data: { ...experiences[i], order: i } });
  }
  console.log("✅ Experiences seeded");

  // Educations
  const educations = [
    { institution: "Universitas Negeri Jakarta", degree: "S.Kom", field: "Sistem Informasi", grade: "3.78", startDate: new Date("2017-08-01"), endDate: new Date("2021-09-01"), current: false, description: "Lulusan Sistem Informasi dengan predikat Cumlaude. Fokus pada analisis data, pengembangan sistem, dan manajemen proyek IT.", achievements: "Juara 1 Business IT Case Competition, Best Final Project Award, Mahasiswa Berprestasi Tingkat Fakultas", organization: "Himpunan Mahasiswa Sistem Informasi (HMSI) - Ketua Divisi Media" },
    { institution: "SMA Negeri 1 Jakarta", degree: "SMA", field: "IPA", grade: "88.5", startDate: new Date("2014-07-01"), endDate: new Date("2017-06-01"), current: false, description: "Lulusan IPA dengan nilai tertinggi di angkatannya.", achievements: "Juara 1 Olimpiade Matematika Tingkat Provinsi", organization: "OSIS - Ketua Bidang Kewirausahaan" },
  ];
  for (let i = 0; i < educations.length; i++) {
    await db.education.create({ data: { ...educations[i], order: i } });
  }
  console.log("✅ Educations seeded");

  // Testimonials
  const testimonials = [
    { name: "Budi Santoso", position: "CEO", company: "PT Maju Bersama", rating: 5, content: "Maulana sangat profesional dalam mengelola digital marketing kami. Hasil kampanye Meta Ads meningkatkan penjualan kami hingga 150% dalam 3 bulan.", featured: true, order: 1 },
    { name: "Sarah Wijaya", position: "Marketing Manager", company: "Fashion Hub", rating: 5, content: "Konten visual yang dibuat sangat menarik dan engaging. Engagement Instagram kami naik drastis setelah bekerja sama dengan beliau.", featured: true, order: 2 },
    { name: "Andi Pratama", position: "Founder", company: "Tech Startup ID", rating: 5, content: "Website yang dibuat sangat modern, cepat, dan SEO friendly. Traffic organik kami naik 200% dalam 6 bulan.", featured: true, order: 3 },
    { name: "Rina Kusuma", position: "Business Owner", company: "Rina Culinary", rating: 5, content: "Video promosi produk kami sangat profesional dan membuat brand terlihat premium. Highly recommended!", featured: true, order: 4 },
    { name: "Doni Hartono", position: "Investor", company: "Independent", rating: 5, content: "Analisis pasar finansial yang diberikan sangat membantu saya dalam mengambil keputusan investasi. Akurat dan informatif.", featured: true, order: 5 },
    { name: "Maya Sari", position: "Brand Manager", company: "Beauty Co", rating: 5, content: "Strategi social media yang direncanakan sangat matang. Keren sekali hasilnya!", featured: false, order: 6 },
  ];
  for (const t of testimonials) {
    await db.testimonial.create({ data: t });
  }
  console.log("✅ Testimonials seeded");

  // FAQs
  const faqs = [
    { question: "Layanan apa saja yang Anda tawarkan?", answer: "Saya menawarkan layanan Digital Marketing, Social Media Management, Photography, Videography, Video Editing, Website Development, UI/UX Design, dan Financial Market Research.", category: "Layanan", order: 1 },
    { question: "Bagaimana cara menghubungi Anda untuk proyek?", answer: "Anda dapat menghubungi saya melalui formulir kontak di halaman Contact, WhatsApp, atau email. Saya akan merespons dalam 1x24 jam.", category: "Layanan", order: 2 },
    { question: "Berapa lama waktu pengerjaan sebuah proyek?", answer: "Waktu pengerjaan tergantung kompleksitas proyek. Untuk digital marketing bulanan, video editing 3-7 hari, pengembangan website 2-8 minggu.", category: "Layanan", order: 3 },
    { question: "Apakah Anda menerima proyek dari luar kota?", answer: "Ya, saya menerima proyek dari seluruh Indonesia maupun internasional. Komunikasi dapat dilakukan secara online melalui Zoom, WhatsApp, atau email.", category: "Layanan", order: 4 },
    { question: "Bagaimana sistem pembayaran?", answer: "Pembayaran dilakukan melalui transfer bank atau e-wallet. Untuk proyek besar, biasanya DP 50% di awal dan pelunasan setelah selesai.", category: "Pembayaran", order: 5 },
    { question: "Apakah Anda menawarkan revisi?", answer: "Ya, setiap proyek termasuk revisi sesuai kesepakatan. Revisi tambahan dapat dikenakan biaya sesuai scope pekerjaan.", category: "Pembayaran", order: 6 },
    { question: "Apakah analisis finansial Anda sebagai saran investasi?", answer: "Analisis yang saya berikan adalah untuk tujuan edukasi dan informasi. Bukan saran investasi. Selalu lakukan riset mandiri sebelum berinvestasi.", category: "Finansial", order: 7 },
    { question: "Apakah Anda bisa membuat konten untuk industri tertentu?", answer: "Ya, saya memiliki pengalaman di berbagai industri seperti F&B, fashion, tech, keuangan, kesehatan, dan lainnya.", category: "Layanan", order: 8 },
  ];
  for (const f of faqs) {
    await db.faq.create({ data: f });
  }
  console.log("✅ FAQs seeded");

  // Portfolios
  const portfolios = [
    { title: "E-Commerce Fashion Platform", slug: "e-commerce-fashion-platform", excerpt: "Platform e-commerce fashion dengan fitur lengkap dan UI modern.", description: "Pengembangan platform e-commerce fashion end-to-end menggunakan Next.js, Prisma, dan Stripe. Fitur mencakup katalog produk, keranjang, checkout, dashboard admin, dan analitik penjualan.", role: "Full-Stack Developer", client: "Fashion Hub ID", status: "PUBLISHED", projectDate: new Date("2024-03-15"), technologies: "Next.js, TypeScript, Prisma, PostgreSQL, Stripe, Tailwind CSS", demoUrl: "https://example.com", featured: true, categoryId: (await db.category.findFirst({ where: { type: "PORTFOLIO", name: "Web Development" } }))?.id },
    { title: "Brand Campaign Video — Kuliner Nusantara", slug: "brand-campaign-video-kuliner", excerpt: "Produksi video kampanye brand kuliner dengan sinematik.", description: "Konsep, shooting, dan editing video kampanye brand kuliner untuk sosial media dan iklan TV. Menggunakan drone, color grading sinematik, dan motion graphics.", role: "Videographer & Editor", client: "Kuliner Nusantara", status: "PUBLISHED", projectDate: new Date("2024-01-20"), technologies: "Sony A7IV, DJI Mavic 3, Adobe Premiere Pro, After Effects", youtubeUrl: "https://youtube.com/watch?v=example", featured: true, categoryId: (await db.category.findFirst({ where: { type: "PORTFOLIO", name: "Video Production" } }))?.id },
    { title: "Meta Ads Campaign — 10x ROAS", slug: "meta-ads-campaign-10x-roas", excerpt: "Kampanye Meta Ads dengan ROAS 10x untuk brand kecantikan.", description: "Strategi dan eksekusi kampanye Meta Ads untuk brand kecantikan dengan budget Rp 50 juta menghasilkan ROAS 10x dalam 2 bulan.", role: "Digital Marketing Strategist", client: "Beauty Co", status: "PUBLISHED", projectDate: new Date("2023-11-10"), technologies: "Meta Ads Manager, Google Analytics, Looker Studio", featured: true, categoryId: (await db.category.findFirst({ where: { type: "PORTFOLIO", name: "Digital Marketing" } }))?.id },
    { title: "Product Photography — Skincare Line", slug: "product-photography-skincare", excerpt: "Fotografi produk skincare premium dengan lighting profesional.", description: "Sesi fotografi produk skincare dengan 15 produk, lighting profesional, dan retouching high-end untuk katalog dan e-commerce.", role: "Product Photographer", client: "Glow Skincare", status: "PUBLISHED", projectDate: new Date("2023-09-05"), technologies: "Canon R5, Studio Lighting, Photoshop, Lightroom", featured: true, categoryId: (await db.category.findFirst({ where: { type: "PORTFOLIO", name: "Photography" } }))?.id },
    { title: "Landing Page SaaS Startup", slug: "landing-page-saas-startup", excerpt: "Landing page SaaS dengan konversi tinggi.", description: "Desain dan pengembangan landing page untuk SaaS startup dengan fokus konversi. A/B testing meningkatkan conversion rate dari 2% ke 7%.", role: "UI/UX Designer & Developer", client: "TechFlow SaaS", status: "PUBLISHED", projectDate: new Date("2024-02-10"), technologies: "Next.js, Figma, Tailwind CSS, Framer Motion", demoUrl: "https://example.com", featured: false, categoryId: (await db.category.findFirst({ where: { type: "PORTFOLIO", name: "Web Development" } }))?.id },
    { title: "Branding Kit — Coffee Shop", slug: "branding-kit-coffee-shop", excerpt: "Identitas brand lengkap untuk coffee shop modern.", description: "Pembuatan logo, color palette, typography, dan brand guidelines untuk coffee shop lokal yang ingin berekspansi.", role: "Brand Designer", client: "Kopi Senja", status: "PUBLISHED", projectDate: new Date("2023-12-01"), technologies: "Adobe Illustrator, Photoshop, Figma", featured: false, categoryId: (await db.category.findFirst({ where: { type: "PORTFOLIO", name: "Branding" } }))?.id },
  ];
  for (const p of portfolios) {
    await db.portfolio.create({ data: p });
  }
  console.log("✅ Portfolios seeded");

  // Blog posts
  const adminUser = await db.user.findFirst();
  const blogCat = await db.category.findFirst({ where: { type: "BLOG" } });
  const blogPosts = [
    { title: "5 Strategi Digital Marketing yang Wajib Dicoba di 2024", slug: "5-strategi-digital-marketing-2024", excerpt: "Strategi terkini untuk meningkatkan performa digital marketing Anda.", content: "<p>Digital marketing terus berkembang. Berikut 5 strategi yang patut dicoba:</p><h2>1. Short-Form Video</h2><p>Platform seperti TikTok, Reels, dan Shorts mendominasi. Konten short-form video memiliki engagement tertinggi.</p><h2>2. AI-Powered Personalization</h2><p>Gunakan AI untuk mempersonalisasi pengalaman pengguna dan meningkatkan konversi.</p><h2>3. Micro-Influencer Marketing</h2><p>Bekerja sama dengan micro-influencer untuk reach yang lebih targeted dan authentic.</p><h2>4. Voice Search Optimization</h2><p>Optimasi konten untuk voice search sebagai tren yang terus berkembang.</p><h2>5. Interactive Content</h2><p>Kuis, kalkulator, dan konten interaktif meningkatkan engagement secara signifikan.</p><p>Dengan mengimplementasikan strategi-strategi ini, bisnis Anda dapat tetap kompetitif di era digital.</p>", coverImage: "", published: true, featured: true, authorId: adminUser!.id, categoryId: blogCat?.id, publishedAt: new Date("2024-03-01") },
    { title: "Cara Membuat Konten Video yang Viral di TikTok", slug: "cara-membuat-konten-video-viral-tiktok", excerpt: "Tips praktis membuat video TikTok yang berpotensi viral.", content: "<p>TikTok telah menjadi platform dengan pertumbuhan tercepat. Berikut cara membuat konten yang berpotensi viral:</p><h2>Hook dalam 3 Detik Pertama</h2><p>Tiga detik pertama sangat krusial. Gunakan hook visual atau verbal yang menarik.</p><h2>Konsisten dengan Niche</h2><p>Pilih niche dan konsisten. Algoritma TikTok menyukai konsistensi.</p><h2>Gunakan Trending Audio</h2><p>Manfaatkan audio yang sedang trending untuk boost reach.</p><h2>Call to Action</h2><p>Selalu sertakan CTA yang jelas untuk engagement.</p>", coverImage: "", published: true, featured: true, authorId: adminUser!.id, categoryId: blogCat?.id, publishedAt: new Date("2024-02-20") },
    { title: "Analisis Saham: Membaca Candlestick untuk Pemula", slug: "analisis-saham-candlestick-untuk-pemula", excerpt: "Panduan dasar membaca pola candlestick untuk trading saham.", content: "<p>Candlestick adalah salah satu cara visual terbaik untuk membaca pergerakan harga saham.</p><h2>Apa itu Candlestick?</h2><p>Candlestick menampilkan harga open, high, low, dan close dalam periode tertentu.</p><h2>Pola Bullish</h2><p>Hammer, Morning Star, dan Bullish Engulfing adalah pola reversal bullish yang umum.</p><h2>Pola Bearish</h2><p>Shooting Star, Evening Star, dan Bearish Engulfing menandakan potensi pembalikan turun.</p><h2>Tips Penting</h2><p>Selalu gunakan candlestick bersama indikator lain dan manajemen risiko yang ketat.</p>", coverImage: "", published: true, featured: true, authorId: adminUser!.id, categoryId: blogCat?.id, publishedAt: new Date("2024-01-15") },
    { title: "Tips Photography Produk untuk E-Commerce", slug: "tips-photography-produk-ecommerce", excerpt: "Meningkatkan penjualan dengan foto produk yang menarik.", content: "<p>Foto produk adalah faktor kunci konversi di e-commerce. Berikut tipsnya:</p><h2>Lighting is Everything</h2><p>Gunakan softbox atau natural light untuk hasil yang profesional.</p><h2>Background Bersih</h2><p>Background putih atau netral fokus pada produk.</p><h2>Multiple Angles</h2><p>Tampilkan produk dari berbagai sudut.</p><h2>Detail Shots</h2><p>Tampilkan tekstur dan detail untuk membangun trust.</p>", coverImage: "", published: true, featured: false, authorId: adminUser!.id, categoryId: blogCat?.id, publishedAt: new Date("2023-12-10") },
    { title: "Kenapa Next.js adalah Framework Masa Depan", slug: "kenapa-nextjs-framework-masa-depan", excerpt: "Keunggulan Next.js untuk pengembangan web modern.", content: "<p>Next.js telah menjadi pilihan utama developer web modern.</p><h2>SSR & SSG</h2><p>Server-side rendering dan static site generation untuk performa optimal.</p><h2>App Router</h2><p>Arsitektur baru dengan App Router memberikan fleksibilitas lebih.</p><h2>SEO Friendly</h2><p>Next.js dirancang untuk SEO dari awal.</p><h2>Ecosystem Matang</h2><p>Dukungan komunitas dan ekosistem yang kuat.</p>", coverImage: "", published: true, featured: false, authorId: adminUser!.id, categoryId: blogCat?.id, publishedAt: new Date("2023-11-25") },
  ];
  for (const p of blogPosts) {
    await db.post.create({ data: p });
  }
  console.log("✅ Blog posts seeded");

  // Certificates
  const certCat = await db.category.findFirst({ where: { type: "CERTIFICATE" } });
  const certificates = [
    { title: "Google Digital Marketing Certification", slug: "google-digital-marketing-certification", issuer: "Google", issueDate: new Date("2023-06-15"), credentialUrl: "https://example.com", credentialId: "GDM-2023-001", description: "Sertifikasi resmi Google untuk Digital Marketing fundamentals.", featured: true, categoryId: certCat?.id },
    { title: "Meta Certified Digital Marketing Associate", slug: "meta-certified-digital-marketing", issuer: "Meta", issueDate: new Date("2023-08-20"), credentialUrl: "https://example.com", credentialId: "META-2023-082", description: "Sertifikasi Meta untuk pengelolaan iklan di platform Facebook & Instagram.", featured: true, categoryId: certCat?.id },
    { title: "Adobe Certified Professional — Premiere Pro", slug: "adobe-premiere-pro-certified", issuer: "Adobe", issueDate: new Date("2022-11-10"), credentialUrl: "https://example.com", credentialId: "ADOBE-PR-2022", description: "Sertifikasi profesional Adobe Premiere Pro untuk video editing.", featured: true, categoryId: certCat?.id },
    { title: "Google Analytics Individual Qualification", slug: "google-analytics-iq", issuer: "Google", issueDate: new Date("2023-04-05"), credentialUrl: "https://example.com", credentialId: "GA-IQ-2023", description: "Sertifikasi Google Analytics untuk analisis web.", featured: false, categoryId: certCat?.id },
    { title: "HubSpot Content Marketing Certification", slug: "hubspot-content-marketing", issuer: "HubSpot", issueDate: new Date("2023-09-12"), credentialUrl: "https://example.com", credentialId: "HUBSPOT-CM-2023", description: "Sertifikasi content marketing dari HubSpot Academy.", featured: false, categoryId: certCat?.id },
    { title: "Bloomberg Market Concepts", slug: "bloomberg-market-concepts", issuer: "Bloomberg", issueDate: new Date("2022-05-20"), credentialUrl: "https://example.com", credentialId: "BMC-2022", description: "Kursus pengantar pasar finansial dari Bloomberg.", featured: true, categoryId: certCat?.id },
  ];
  for (const c of certificates) {
    await db.certificate.create({ data: c });
  }
  console.log("✅ Certificates seeded");

  // Galleries
  const galCat = await db.category.findFirst({ where: { type: "GALLERY" } });
  const galleries = [
    { title: "Jakarta Cityscape", slug: "jakarta-cityscape", type: "IMAGE", album: "Travel Photography", description: "Pemandangan kota Jakarta di malam hari.", url: "https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=1200", featured: true, categoryId: galCat?.id },
    { title: "Street Photography Bali", slug: "street-photography-bali", type: "IMAGE", album: "Travel Photography", description: "Kehidupan jalanan di Bali.", url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200", featured: true, categoryId: galCat?.id },
    { title: "Mountain Landscape", slug: "mountain-landscape", type: "IMAGE", album: "Nature", description: "Pegunungan saat sunrise.", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200", featured: true, categoryId: galCat?.id },
    { title: "Coffee Aesthetic", slug: "coffee-aesthetic", type: "IMAGE", album: "Product Photography", description: "Fotografi produk kopi.", url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200", featured: false, categoryId: galCat?.id },
    { title: "Portrait Session", slug: "portrait-session", type: "IMAGE", album: "Portrait", description: "Sesi portrait outdoor.", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200", featured: false, categoryId: galCat?.id },
    { title: "Event Coverage", slug: "event-coverage", type: "IMAGE", album: "Events", description: "Coverage acara corporate.", url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200", featured: false, categoryId: galCat?.id },
    { title: "Fashion Shoot", slug: "fashion-shoot", type: "IMAGE", album: "Fashion", description: "Photoshoot fashion editorial.", url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200", featured: true, categoryId: galCat?.id },
    { title: "Beach Vibes", slug: "beach-vibes", type: "IMAGE", album: "Travel Photography", description: "Pantai saat golden hour.", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200", featured: false, categoryId: galCat?.id },
  ];
  for (const g of galleries) {
    await db.gallery.create({ data: g });
  }
  console.log("✅ Galleries seeded");

  // Market articles
  const marketArticles = [
    { title: "Outlook Pasar Saham Q1 2024", slug: "outlook-pasar-saham-q1-2024", type: "ANALYSIS", instrument: "IHSG", excerpt: "Proyeksi pergerakan IHSG di kuartal pertama 2024.", content: "<p>IHSG diperkirakan akan terus tumbuh dengan support dari sektor perbankan dan teknologi. Investor perlu memperhatikan kebijakan moneter Bank Indonesia dan tren global.</p>", published: true, featured: true, publishedAt: new Date("2024-01-05") },
    { title: "Analisis Teknikal Bitcoin — Breakout atau False Move?", slug: "analisis-teknikal-bitcoin", type: "TECHNICAL", instrument: "BTC/USD", excerpt: "Pembacaan chart Bitcoin dengan indikator teknikal.", content: "<p>Bitcoin mengalami konsolidasi di area $42,000-$44,000. Breakout ke atas bisa membawa harga ke $50,000, sementara breakdown dapat menurunkan ke $38,000.</p>", published: true, featured: true, publishedAt: new Date("2024-01-10") },
    { title: "Pentingnya Risk Management dalam Trading", slug: "pentingnya-risk-management-trading", type: "RISK", excerpt: "Panduan risk management untuk trader pemula.", content: "<p>Risk management adalah kunci kesuksesan trading jangka panjang. Selalu gunakan stop loss, risk max 1-2% per trade, dan diversifikasi portofolio.</p>", published: true, featured: true, publishedAt: new Date("2024-01-12") },
    { title: "Fundamental Analysis: Cara Membaca Laporan Keuangan", slug: "fundamental-analysis-laporan-keuangan", type: "FUNDAMENTAL", instrument: "Saham", excerpt: "Dasar membaca laporan keuangan perusahaan.", content: "<p>Laporan keuangan terdiri dari neraca, laba rugi, dan arus kas. Pahami rasio seperti PER, PBV, ROE, dan DER untuk menilai kesehatan perusahaan.</p>", published: true, featured: false, publishedAt: new Date("2024-01-08") },
    { title: "Trading Journal: Belajar dari Kesalahan", slug: "trading-journal-belajar-dari-kesalahan", type: "JOURNAL", excerpt: "Catatan trading dan pelajaran berharga.", content: "<p>Trading journal membantu kita belajar dari kesalahan. Catat setiap trade: alasan entry, exit, emosi, dan hasil untuk evaluasi berkala.</p>", published: true, featured: false, publishedAt: new Date("2024-01-15") },
  ];
  for (const m of marketArticles) {
    await db.marketArticle.create({ data: m as any });
  }
  console.log("✅ Market articles seeded");

  // Watchlist
  const watchlist = [
    { symbol: "BBCA.JK", name: "Bank Central Asia", type: "STOCK", targetPrice: "9500" },
    { symbol: "BBRI.JK", name: "Bank Rakyat Indonesia", type: "STOCK", targetPrice: "5500" },
    { symbol: "TLKM.JK", name: "Telkom Indonesia", type: "STOCK", targetPrice: "3500" },
    { symbol: "GOTO.JK", name: "GoTo Gojek Tokopedia", type: "STOCK" },
    { symbol: "BTCUSD", name: "Bitcoin", type: "CRYPTO", targetPrice: "50000" },
    { symbol: "ETHUSD", name: "Ethereum", type: "CRYPTO", targetPrice: "3000" },
    { symbol: "EURUSD", name: "Euro / US Dollar", type: "FOREX" },
    { symbol: "XAUUSD", name: "Gold", type: "COMMODITY" },
  ];
  for (const w of watchlist) {
    await db.watchlist.create({ data: w });
  }
  console.log("✅ Watchlist seeded");

  // Portfolio holdings
  const holdings = [
    { symbol: "BBCA.JK", name: "Bank Central Asia", type: "STOCK", quantity: 100, buyPrice: 8500, currentPrice: 9200 },
    { symbol: "TLKM.JK", name: "Telkom Indonesia", type: "STOCK", quantity: 500, buyPrice: 3200, currentPrice: 3100 },
    { symbol: "BTCUSD", name: "Bitcoin", type: "CRYPTO", quantity: 0.5, buyPrice: 38000, currentPrice: 43000 },
    { symbol: "ETHUSD", name: "Ethereum", type: "CRYPTO", quantity: 3, buyPrice: 2200, currentPrice: 2500 },
  ];
  for (const h of holdings) {
    await db.portfolioHolding.create({ data: h });
  }
  console.log("✅ Portfolio holdings seeded");

  console.log("🌱 Seeding complete!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
