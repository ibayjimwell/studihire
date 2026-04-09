// Comprehensive mock data for StudiHire app

export const generateMockData = () => {
  // Mock Users
  const mockUsers = [
    {
      id: "user-1",
      email: "john.doe@example.com",
      full_name: "John Doe",
      role: "student",
    },
    {
      id: "user-2",
      email: "jane.smith@example.com",
      full_name: "Jane Smith",
      role: "client",
    },
    {
      id: "user-3",
      email: "admin@example.com",
      full_name: "Admin User",
      role: "admin",
    },
  ];

  // Generate 15 Student Profiles
  const mockStudentProfiles = [
    {
      id: "sp-1",
      user_id: "user-1",
      full_name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      address: "123 Main St, New York, NY",
      school_name: "NYU",
      course: "Computer Science",
      year_level: "4th Year",
      graduation_year: 2024,
      bio: "Full stack developer passionate about web development and mobile apps.",
      avatar_url: "https://via.placeholder.com/150?text=JD",
      skills: ["JavaScript", "React", "Node.js", "Python", "SQL"],
      portfolio_links: ["https://github.com/johndoe", "https://johndoe.dev"],
      resume_url: "https://example.com/resume.pdf",
      school_id_url: "https://example.com/school-id.jpg",
      work_experience: [
        {
          title: "Intern Developer",
          company: "Tech Corp",
          duration: "Jan 2023 - Jun 2023",
          description: "Developed web applications using React and Node.js",
        },
      ],
      education: [
        {
          degree: "Bachelor of Science in Computer Science",
          institution: "NYU",
          year: 2024,
        },
      ],
      verification_status: "approved",
      rating: 4.8,
      total_reviews: 12,
      created_date: "2023-01-15T10:00:00Z",
    },
    {
      id: "sp-2",
      user_id: "user-4",
      full_name: "Sarah Wilson",
      email: "sarah.wilson@example.com",
      phone: "+1234567891",
      address: "456 Tech Ave, San Francisco, CA",
      school_name: "Stanford University",
      course: "Electrical Engineering",
      year_level: "3rd Year",
      graduation_year: 2025,
      bio: "Electronics and embedded systems enthusiast.",
      avatar_url: "https://via.placeholder.com/150?text=SW",
      skills: ["C++", "Arduino", "Circuit Design", "IoT"],
      portfolio_links: [],
      resume_url: null,
      school_id_url: null,
      work_experience: [],
      education: [
        {
          degree: "Bachelor of Electrical Engineering",
          institution: "Stanford University",
          year: 2025,
        },
      ],
      verification_status: "approved",
      rating: 4.5,
      total_reviews: 8,
      created_date: "2023-02-20T14:30:00Z",
    },
    ...Array.from({ length: 13 }, (_, i) => ({
      id: `sp-${i + 3}`,
      user_id: `user-${i + 5}`,
      full_name: `Student ${i + 3}`,
      email: `student${i + 3}@example.com`,
      phone: `+123456789${i}`,
      address: `${100 + i * 10} Main St, City, State`,
      school_name: "University of Example",
      course: "Computer Science",
      year_level: `${(i % 4) + 1}${["st", "nd", "rd", "th"][i % 4]} Year`,
      graduation_year: 2024 + Math.floor(i / 2),
      bio: `Passionate about web development and learning new technologies.`,
      avatar_url: `https://via.placeholder.com/150?text=S${i + 3}`,
      skills: ["JavaScript", "React", "Node.js", "Python"],
      portfolio_links: [],
      resume_url: null,
      school_id_url: null,
      work_experience: [],
      education: [
        {
          degree: "Bachelor of Computer Science",
          institution: "University of Example",
          year: 2024 + Math.floor(i / 2),
        },
      ],
      verification_status: i % 2 === 0 ? "approved" : "pending",
      rating: 4.0 + Math.random() * 0.8,
      total_reviews: Math.floor(Math.random() * 15),
      created_date: new Date(2023, i % 12, (i % 28) + 1).toISOString(),
    })),
  ];

  // Generate 10 Client Profiles
  const mockClientProfiles = [
    {
      id: "cp-1",
      user_id: "user-2",
      full_name: "Jane Smith",
      email: "jane.smith@example.com",
      company_name: "Smith Enterprises",
      company_type: "Startup",
      verification_status: "approved",
      created_date: "2023-03-20T14:30:00Z",
    },
    ...Array.from({ length: 9 }, (_, i) => ({
      id: `cp-${i + 2}`,
      user_id: `user-${20 + i}`,
      full_name: `Client ${i + 2}`,
      email: `client${i + 2}@example.com`,
      company_name: `Company ${i + 2}`,
      company_type: ["Startup", "SME", "Enterprise", "Agency"][i % 4],
      verification_status: i % 3 === 0 ? "pending" : "approved",
      created_date: new Date(2023, i % 12, (i % 28) + 1).toISOString(),
    })),
  ];

  // Generate 30 Gigs
  const gigTitles = [
    "Full-Stack Web Development",
    "Mobile App Development",
    "UI/UX Design",
    "Logo Design",
    "Content Writing",
    "SEO Optimization",
    "API Development",
    "Database Design",
    "WordPress Development",
    "E-commerce Setup",
  ];

  const mockGigs = gigTitles.flatMap((title, idx) =>
    Array.from({ length: 3 }, (_, i) => ({
      id: `gig-${idx * 3 + i + 1}`,
      student_id: `user-${(idx * 3 + i + 1) % 14 === 0 ? 1 : (idx * 3 + i + 1) % 14}`,
      title: `${title} ${i + 1}`,
      description: `Professional ${title.toLowerCase()} services. High quality work delivered on time.`,
      category: [
        "Web Development",
        "Design",
        "Writing",
        "Marketing",
        "Programming",
      ][Math.floor(idx / 2) % 5],
      subcategory: title,
      cover_image_url: `https://via.placeholder.com/400x300?text=${title}`,
      skills_required: ["JavaScript", "React", "Node.js"].slice(0, (i % 3) + 1),
      tags: ["professional", "quality", "fast"],
      packages: [
        {
          name: "Basic",
          description: "Basic service package",
          price: 500 + idx * 100,
          delivery_days: 5 + i,
          revisions: 2,
          features: ["Feature 1", "Feature 2"],
        },
        {
          name: "Standard",
          description: "Standard service package",
          price: 1000 + idx * 100,
          delivery_days: 10 + i,
          revisions: 5,
          features: ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
        },
        {
          name: "Premium",
          description: "Premium service package",
          price: 2000 + idx * 100,
          delivery_days: 15 + i,
          revisions: 10,
          features: ["All Features"],
        },
      ],
      rating: 4.0 + Math.random() * 1.0,
      total_reviews: Math.floor(Math.random() * 30),
      total_orders: Math.floor(Math.random() * 50) + 1,
      status: i === 0 ? "draft" : "active",
      faq: [
        {
          question: "How long does it take?",
          answer: "Depends on the package selected.",
        },
      ],
      created_date: new Date(
        2023,
        idx % 12,
        ((idx * 3 + i) % 28) + 1,
      ).toISOString(),
    })),
  );

  // Generate 15 Projects
  const mockProjects = Array.from({ length: 15 }, (_, i) => {
    const skillCategories = [
      ["Web Development", "React", "Node.js"],
      ["Mobile Development", "React Native", "iOS"],
      ["UI/UX Design", "Figma", "Prototyping"],
      ["DevOps", "Docker", "AWS"],
      ["Machine Learning", "Python", "TensorFlow"],
      ["Cloud Architecture", "Azure", "Microservices"],
    ];
    return {
      id: `proj-${i + 1}`,
      client_id: `user-${20 + (i % 10)}`,
      title: `Project: ${["E-commerce", "SaaS Platform", "Mobile App", "Dashboard", "API Gateway", "CMS System"][i % 6]} ${i + 1}`,
      description: "Need custom development for our business needs.",
      skills_needed: skillCategories[i % skillCategories.length],
      budget_min: 5000 + i * 1000,
      budget_max: 20000 + i * 2000,
      budget_type: i % 2 === 0 ? "fixed" : "hourly",
      status: i % 3 === 0 ? "closed" : i % 2 === 0 ? "in_progress" : "open",
      created_date: new Date(2024, i % 4, (i % 28) + 1).toISOString(),
    };
  });

  // Generate 40 Orders
  const mockOrders = Array.from({ length: 40 }, (_, i) => {
    const statuses = [
      "awaiting_payment",
      "pending",
      "in_progress",
      "revision_requested",
      "delivered",
      "completed",
    ];
    return {
      id: `order-${i + 1}`,
      gig_id: `gig-${(i % 30) + 1}`,
      gig_title: `Service ${(i % 30) + 1}`,
      client_id: `user-${20 + (i % 10)}`,
      client_name: `Client ${(i % 10) + 1}`,
      student_id: `user-${i % 14 === 0 ? 1 : i % 14}`,
      student_name: `Student ${(i % 14) + 1}`,
      package_name: ["Basic", "Standard", "Premium"][i % 3],
      package_index: i % 3,
      amount: 500 + i * 100,
      delivery_days: 5 + (i % 10),
      revisions: 2 + (i % 5),
      requirements: "Custom requirements for this order",
      status: statuses[i % statuses.length],
      due_date: new Date(2024, 2, 15 + (i % 15)).toISOString(),
      payment_id: `pay-${(i % 20) + 1}`,
      created_date: new Date(2024, 1, (i % 28) + 1).toISOString(),
    };
  });

  // Generate 25 Payments
  const mockPayments = Array.from({ length: 25 }, (_, i) => ({
    id: `pay-${i + 1}`,
    client_id: `user-${20 + (i % 10)}`,
    student_id: `user-${i % 14 === 0 ? 1 : i % 14}`,
    gig_id: `gig-${(i % 30) + 1}`,
    amount: 500 + i * 200,
    platform_fee: Math.floor((500 + i * 200) * 0.1),
    net_amount: Math.floor((500 + i * 200) * 0.9),
    currency: "PHP",
    status: ["pending", "paid", "released", "disputed"][(i + 1) % 4],
    description: `Payment for Gig ${(i % 30) + 1}`,
    payment_method: ["Credit Card", "Bank Transfer", "E-Wallet"][i % 3],
    created_date: new Date(2024, 1, (i % 28) + 1).toISOString(),
  }));

  // Generate 20 Conversations
  const mockConversations = Array.from({ length: 20 }, (_, i) => ({
    id: `conv-${i + 1}`,
    participant_ids: [
      `user-${i % 14 === 0 ? 1 : i % 14}`,
      `user-${20 + (i % 10)}`,
    ],
    participant_names: [`Student ${(i % 14) + 1}`, `Client ${(i % 10) + 1}`],
    related_gig_id: `gig-${(i % 30) + 1}`,
    unread_counts: {
      [`user-${i % 14 === 0 ? 1 : i % 14}`]: i % 2,
      [`user-${20 + (i % 10)}`]: 0,
    },
    last_message: `Great work on this project!`,
    last_message_at: new Date(2024, 2, 15 - i).toISOString(),
    status: "active",
    created_date: new Date(2024, 1, (i % 28) + 1).toISOString(),
  }));

  // Generate 60 Messages
  const mockMessages = Array.from({ length: 60 }, (_, i) => ({
    id: `msg-${i + 1}`,
    conversation_id: `conv-${(i % 20) + 1}`,
    sender_id: `user-${i % 2 === 0 ? 1 : 20}`,
    sender_name: i % 2 === 0 ? "John Doe" : "Client",
    content: [
      "This looks great! Can you make some adjustments?",
      "Sure, I'll update that for you.",
      "Perfect! Thank you for the quick turnaround.",
      "You're welcome! Happy to help.",
      "Great work on this project!",
      "I really appreciate your professionalism.",
    ][i % 6],
    message_type: "text",
    created_date: new Date(2024, 2, Math.floor(i / 6) + 1).toISOString(),
  }));

  // Generate 30 Notifications
  const mockNotifications = Array.from({ length: 30 }, (_, i) => ({
    id: `notif-${i + 1}`,
    user_id: `user-${(i % 3) + 1}`,
    type: [
      "gig_order",
      "payment_update",
      "message",
      "review_received",
      "verification_update",
    ][i % 5],
    title: [
      "New Order",
      "Payment Received",
      "New Message",
      "Rating Received",
      "Profile Updated",
    ][i % 5],
    body: "You have a new notification",
    link: "/orders",
    is_read: i % 2 === 0,
    created_date: new Date(2024, 2, Math.floor(i / 6) + 1).toISOString(),
  }));

  // Generate 20 Portfolio Items
  const mockPortfolios = Array.from({ length: 20 }, (_, i) => ({
    id: `port-${i + 1}`,
    student_profile_id: `sp-${(i % 15) + 1}`,
    image_url: `https://via.placeholder.com/400x300?text=Portfolio+${i + 1}`,
    project_url: `https://example-project-${i + 1}.com`,
    tags: ["React", "Node.js", "Design"][i % 3].split(", "),
    created_date: new Date(2023, i % 12, (i % 28) + 1).toISOString(),
  }));

  // Generate 30 Reviews
  const mockReviews = Array.from({ length: 30 }, (_, i) => ({
    id: `rev-${i + 1}`,
    reviewer_id: `user-${20 + (i % 10)}`,
    gig_id: `gig-${(i % 30) + 1}`,
    rating: 4 + Math.floor(Math.random() * 2),
    comment: [
      "Excellent work! Highly recommended.",
      "Great quality and fast delivery.",
      "Professional and responsive to feedback.",
      "Very satisfied with the results!",
      "Outstanding work! Will hire again.",
    ][i % 5],
    is_public: true,
    created_date: new Date(2024, 1, (i % 28) + 1).toISOString(),
  }));

  // Generate 8 Disputes
  const mockDisputes = Array.from({ length: 8 }, (_, i) => ({
    id: `disp-${i + 1}`,
    payment_id: `pay-${(i % 25) + 1}`,
    reason: ["Service not as described", "Delay in delivery", "Quality issues"][
      i % 3
    ],
    status: i % 2 === 0 ? "open" : "resolved",
    created_date: new Date(2024, 2, (i % 28) + 1).toISOString(),
  }));

  // Generate 5 Reports
  const mockReports = Array.from({ length: 5 }, (_, i) => ({
    id: `rep-${i + 1}`,
    reason: ["Inappropriate content", "Spam", "Fraudulent activity"][i % 3],
    status: i % 2 === 0 ? "open" : "closed",
    created_date: new Date(2024, 1, (i % 28) + 1).toISOString(),
  }));

  return {
    mockUsers,
    mockStudentProfiles,
    mockClientProfiles,
    mockGigs,
    mockProjects,
    mockOrders,
    mockPayments,
    mockConversations,
    mockMessages,
    mockNotifications,
    mockPortfolios,
    mockReviews,
    mockDisputes,
    mockReports,
  };
};
