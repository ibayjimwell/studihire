// Mock Base44 Client for hardcoded data
// This replaces the real Base44 SDK with dummy data to showcase the UI

// Mock User Data
const mockUsers = [
  {
    id: 'user-1',
    email: 'john.doe@example.com',
    full_name: 'John Doe',
    role: 'student'
  },
  {
    id: 'user-2',
    email: 'jane.smith@example.com',
    full_name: 'Jane Smith',
    role: 'client'
  },
  {
    id: 'user-3',
    email: 'admin@example.com',
    full_name: 'Admin User',
    role: 'admin'
  }
];

// Mock Student Profiles
const mockStudentProfiles = [
  {
    id: 'sp-1',
    user_id: 'user-1',
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St, City, Country',
    school_name: 'University of Example',
    course: 'Computer Science',
    year_level: '4th Year',
    graduation_year: 2024,
    bio: 'Passionate computer science student with experience in web development and mobile apps.',
    avatar_url: 'https://via.placeholder.com/150',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
    portfolio_links: ['https://github.com/johndoe', 'https://johndoe.dev'],
    resume_url: 'https://example.com/resume.pdf',
    school_id_url: 'https://example.com/school-id.jpg',
    work_experience: [
      {
        title: 'Intern Developer',
        company: 'Tech Corp',
        duration: 'Jan 2023 - Jun 2023',
        description: 'Developed web applications using React and Node.js'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of Example',
        year: 2024
      }
    ],
    verification_status: 'approved',
    rating: 4.8,
    total_reviews: 12,
    created_date: '2023-01-15T10:00:00Z'
  },
  {
    id: 'sp-2',
    user_id: 'user-2',
    full_name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1234567891',
    address: '456 Business Ave, City, Country',
    school_name: 'Business University',
    course: 'Business Administration',
    year_level: '3rd Year',
    graduation_year: 2025,
    bio: 'Business student looking for marketing and administrative services.',
    avatar_url: 'https://via.placeholder.com/150',
    skills: ['Marketing', 'Social Media', 'Excel', 'Communication'],
    portfolio_links: [],
    resume_url: null,
    school_id_url: null,
    work_experience: [],
    education: [
      {
        degree: 'Bachelor of Business Administration',
        institution: 'Business University',
        year: 2025
      }
    ],
    verification_status: 'pending',
    rating: 0,
    total_reviews: 0,
    created_date: '2023-03-20T14:30:00Z'
  }
];

// Mock Client Profiles
const mockClientProfiles = [
  {
    id: 'cp-1',
    user_id: 'user-2',
    full_name: 'Jane Smith',
    email: 'jane.smith@example.com',
    company_name: 'Smith Enterprises',
    company_type: 'Startup',
    verification_status: 'approved',
    created_date: '2023-03-20T14:30:00Z'
  }
];

// Mock Gigs
const mockGigs = [
  {
    id: 'gig-1',
    student_id: 'user-1',
    title: 'Full-Stack Web Development',
    description: 'I create modern, responsive web applications using React, Node.js, and MongoDB. Perfect for startups and small businesses.',
    category: 'Web Development',
    subcategory: 'Full-Stack',
    cover_image_url: 'https://via.placeholder.com/400x300',
    skills_required: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    tags: ['web-app', 'responsive', 'modern'],
    packages: [
      {
        name: 'Basic Website',
        description: 'Simple landing page with contact form',
        price: 5000,
        delivery_days: 7,
        revisions: 2,
        features: ['Responsive Design', 'Contact Form', 'Basic SEO']
      },
      {
        name: 'Full Web App',
        description: 'Complete web application with database',
        price: 15000,
        delivery_days: 21,
        revisions: 5,
        features: ['Full-Stack App', 'Database Integration', 'User Authentication', 'Admin Panel']
      }
    ],
    rating: 4.8,
    total_reviews: 12,
    total_orders: 8,
    status: 'active',
    faq: [
      {
        question: 'Do you provide source code?',
        answer: 'Yes, all source code is included with delivery.'
      }
    ],
    created_date: '2023-02-01T09:00:00Z'
  },
  {
    id: 'gig-2',
    student_id: 'user-1',
    title: 'Mobile App Development',
    description: 'Cross-platform mobile apps using React Native. iOS and Android compatible.',
    category: 'Mobile Development',
    subcategory: 'React Native',
    cover_image_url: 'https://via.placeholder.com/400x300',
    skills_required: ['React Native', 'JavaScript', 'Firebase'],
    tags: ['mobile-app', 'cross-platform', 'react-native'],
    packages: [
      {
        name: 'Basic App',
        description: 'Simple mobile app with basic features',
        price: 8000,
        delivery_days: 14,
        revisions: 3,
        features: ['iOS & Android', 'Basic UI', 'API Integration']
      }
    ],
    rating: 4.9,
    total_reviews: 5,
    total_orders: 3,
    status: 'active',
    faq: [],
    created_date: '2023-03-15T11:00:00Z'
  }
];

// Mock Projects
const mockProjects = [
  {
    id: 'proj-1',
    client_id: 'user-2',
    title: 'E-commerce Website Development',
    description: 'Need a modern e-commerce website for our retail business. Should include product catalog, shopping cart, and payment integration.',
    skills_needed: ['Web Development', 'E-commerce', 'Payment Integration'],
    budget_min: 20000,
    budget_max: 50000,
    budget_type: 'fixed',
    status: 'open',
    created_date: '2023-04-01T10:00:00Z'
  }
];

// Mock Orders
const mockOrders = [
  {
    id: 'order-1',
    gig_id: 'gig-1',
    gig_title: 'Full-Stack Web Development',
    client_id: 'user-2',
    client_name: 'Jane Smith',
    student_id: 'user-1',
    student_name: 'John Doe',
    package_name: 'Basic Website',
    package_index: 0,
    amount: 5000,
    delivery_days: 7,
    revisions: 2,
    requirements: 'Need a landing page for my startup with contact form and portfolio section.',
    status: 'in_progress',
    due_date: '2023-05-01T10:00:00Z',
    payment_id: 'pay-1',
    created_date: '2023-04-15T14:00:00Z'
  }
];

// Mock Payments
const mockPayments = [
  {
    id: 'pay-1',
    client_id: 'user-2',
    student_id: 'user-1',
    gig_id: 'gig-1',
    amount: 5000,
    platform_fee: 500,
    net_amount: 4500,
    currency: 'PHP',
    status: 'paid',
    description: 'Payment for Full-Stack Web Development - Basic Website',
    payment_method: 'Credit Card',
    created_date: '2023-04-15T14:00:00Z'
  }
];

// Mock Conversations
const mockConversations = [
  {
    id: 'conv-1',
    participant_ids: ['user-1', 'user-2'],
    participant_names: ['John Doe', 'Jane Smith'],
    related_gig_id: 'gig-1',
    unread_counts: { 'user-1': 0, 'user-2': 1 },
    last_message: 'Hi John, I have some questions about the package.',
    last_message_at: '2023-04-20T16:00:00Z',
    status: 'active',
    created_date: '2023-04-15T14:00:00Z'
  }
];

// Mock Messages
const mockMessages = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-2',
    sender_name: 'Jane Smith',
    content: 'Hi John, I\'m interested in your Full-Stack Web Development gig. Can you tell me more about the Basic Website package?',
    message_type: 'text',
    created_date: '2023-04-15T14:05:00Z'
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    sender_id: 'user-1',
    sender_name: 'John Doe',
    content: 'Hi Jane! The Basic Website package includes a responsive landing page with contact form, portfolio section, and basic SEO optimization. It\'s perfect for startups.',
    message_type: 'text',
    created_date: '2023-04-15T14:10:00Z'
  },
  {
    id: 'msg-3',
    conversation_id: 'conv-1',
    sender_id: 'user-2',
    sender_name: 'Jane Smith',
    content: 'That sounds great! I\'d like to proceed with the order.',
    message_type: 'text',
    created_date: '2023-04-20T16:00:00Z'
  }
];

// Mock Notifications
const mockNotifications = [
  {
    id: 'notif-1',
    user_id: 'user-1',
    type: 'gig_order',
    title: 'New Order Received',
    body: 'You have received a new order for "Full-Stack Web Development"',
    link: '/student/orders',
    is_read: false,
    created_date: '2023-04-15T14:00:00Z'
  },
  {
    id: 'notif-2',
    user_id: 'user-2',
    type: 'payment_update',
    title: 'Payment Successful',
    body: 'Your payment of ₱5,000 has been processed successfully',
    link: '/client/orders',
    is_read: true,
    created_date: '2023-04-15T14:05:00Z'
  }
];

// Mock Portfolio
const mockPortfolios = [
  {
    id: 'port-1',
    student_profile_id: 'sp-1',
    image_url: 'https://via.placeholder.com/400x300',
    project_url: 'https://example-project.com',
    tags: ['React', 'Node.js', 'Web App'],
    created_date: '2023-03-01T10:00:00Z'
  }
];

// Mock Reviews
const mockReviews = [
  {
    id: 'rev-1',
    reviewer_id: 'user-2',
    gig_id: 'gig-1',
    rating: 5,
    comment: 'Excellent work! John delivered exactly what I asked for and on time.',
    is_public: true,
    created_date: '2023-04-10T12:00:00Z'
  }
];

// Mock Disputes
const mockDisputes = [
  {
    id: 'disp-1',
    payment_id: 'pay-1',
    reason: 'Service not delivered as promised',
    status: 'open',
    created_date: '2023-04-25T09:00:00Z'
  }
];

// Mock Reports
const mockReports = [
  {
    id: 'rep-1',
    reason: 'Inappropriate content',
    status: 'open',
    created_date: '2023-04-20T11:00:00Z'
  }
];

// Helper functions
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

const filterData = (data, filterObj) => {
  if (!filterObj || Object.keys(filterObj).length === 0) return data;
  return data.filter(item => {
    return Object.entries(filterObj).every(([key, value]) => {
      if (Array.isArray(value)) {
        return value.includes(item[key]);
      }
      return item[key] === value;
    });
  });
};

const sortData = (data, sortField) => {
  if (!sortField) return data;
  const isDesc = sortField.startsWith('-');
  const field = isDesc ? sortField.slice(1) : sortField;
  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (isDesc) {
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
};

const limitData = (data, limit) => {
  return limit ? data.slice(0, limit) : data;
};

// Mock Base44 Client
export const base44 = {
  auth: {
    me: async () => {
      await delay();
      // Return the first user as current user (student)
      return mockUsers[0];
    },
    logout: async (redirectPath = '/') => {
      await delay();
      // In a real app, this would clear tokens
      window.location.href = redirectPath;
    }
  },

  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        await delay(500); // Simulate upload time
        return {
          file_url: `https://via.placeholder.com/400x300?text=${file.name || 'Uploaded File'}`
        };
      },
      InvokeLLM: async ({ prompt, file_urls, response_json_schema }) => {
        await delay(1000); // Simulate AI processing
        // Mock resume parsing result
        return {
          full_name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          skills: ['JavaScript', 'React', 'Node.js', 'Python'],
          education: [{
            degree: 'Bachelor of Science in Computer Science',
            institution: 'University of Example',
            year: 2024
          }],
          work_experience: [{
            title: 'Intern Developer',
            company: 'Tech Corp',
            duration: 'Jan 2023 - Jun 2023',
            description: 'Developed web applications'
          }]
        };
      }
    }
  },

  entities: {
    StudentProfile: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockStudentProfiles, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockStudentProfiles, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newProfile = {
          ...data,
          id: `sp-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockStudentProfiles.push(newProfile);
        return newProfile;
      },
      update: async (id, data) => {
        await delay();
        const index = mockStudentProfiles.findIndex(p => p.id === id);
        if (index !== -1) {
          mockStudentProfiles[index] = { ...mockStudentProfiles[index], ...data };
          return mockStudentProfiles[index];
        }
        throw new Error('Profile not found');
      },
      delete: async (id) => {
        await delay();
        const index = mockStudentProfiles.findIndex(p => p.id === id);
        if (index !== -1) {
          mockStudentProfiles.splice(index, 1);
          return true;
        }
        throw new Error('Profile not found');
      }
    },

    ClientProfile: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockClientProfiles, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockClientProfiles, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newProfile = {
          ...data,
          id: `cp-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockClientProfiles.push(newProfile);
        return newProfile;
      },
      update: async (id, data) => {
        await delay();
        const index = mockClientProfiles.findIndex(p => p.id === id);
        if (index !== -1) {
          mockClientProfiles[index] = { ...mockClientProfiles[index], ...data };
          return mockClientProfiles[index];
        }
        throw new Error('Profile not found');
      }
    },

    Gig: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockGigs, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockGigs, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newGig = {
          ...data,
          id: `gig-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockGigs.push(newGig);
        return newGig;
      },
      update: async (id, data) => {
        await delay();
        const index = mockGigs.findIndex(g => g.id === id);
        if (index !== -1) {
          mockGigs[index] = { ...mockGigs[index], ...data };
          return mockGigs[index];
        }
        throw new Error('Gig not found');
      },
      delete: async (id) => {
        await delay();
        const index = mockGigs.findIndex(g => g.id === id);
        if (index !== -1) {
          mockGigs.splice(index, 1);
          return true;
        }
        throw new Error('Gig not found');
      }
    },

    Project: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockProjects, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockProjects, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newProject = {
          ...data,
          id: `proj-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockProjects.push(newProject);
        return newProject;
      },
      update: async (id, data) => {
        await delay();
        const index = mockProjects.findIndex(p => p.id === id);
        if (index !== -1) {
          mockProjects[index] = { ...mockProjects[index], ...data };
          return mockProjects[index];
        }
        throw new Error('Project not found');
      }
    },

    Order: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockOrders, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockOrders, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newOrder = {
          ...data,
          id: `order-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockOrders.push(newOrder);
        return newOrder;
      },
      update: async (id, data) => {
        await delay();
        const index = mockOrders.findIndex(o => o.id === id);
        if (index !== -1) {
          mockOrders[index] = { ...mockOrders[index], ...data };
          return mockOrders[index];
        }
        throw new Error('Order not found');
      }
    },

    Payment: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockPayments, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockPayments, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newPayment = {
          ...data,
          id: `pay-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockPayments.push(newPayment);
        return newPayment;
      },
      update: async (id, data) => {
        await delay();
        const index = mockPayments.findIndex(p => p.id === id);
        if (index !== -1) {
          mockPayments[index] = { ...mockPayments[index], ...data };
          return mockPayments[index];
        }
        throw new Error('Payment not found');
      }
    },

    Conversation: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockConversations, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockConversations, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newConv = {
          ...data,
          id: `conv-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockConversations.push(newConv);
        return newConv;
      },
      update: async (id, data) => {
        await delay();
        const index = mockConversations.findIndex(c => c.id === id);
        if (index !== -1) {
          mockConversations[index] = { ...mockConversations[index], ...data };
          return mockConversations[index];
        }
        throw new Error('Conversation not found');
      }
    },

    Message: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockMessages, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockMessages, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newMessage = {
          ...data,
          id: `msg-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockMessages.push(newMessage);
        return newMessage;
      },
      subscribe: (callback) => {
        // Mock subscription - in real app this would be WebSocket
        // For demo, just return unsubscribe function
        return () => {};
      }
    },

    Notification: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockNotifications, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockNotifications, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newNotif = {
          ...data,
          id: `notif-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockNotifications.push(newNotif);
        return newNotif;
      },
      update: async (id, data) => {
        await delay();
        const index = mockNotifications.findIndex(n => n.id === id);
        if (index !== -1) {
          mockNotifications[index] = { ...mockNotifications[index], ...data };
          return mockNotifications[index];
        }
        throw new Error('Notification not found');
      }
    },

    Portfolio: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockPortfolios, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockPortfolios, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newPortfolio = {
          ...data,
          id: `port-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockPortfolios.push(newPortfolio);
        return newPortfolio;
      },
      update: async (id, data) => {
        await delay();
        const index = mockPortfolios.findIndex(p => p.id === id);
        if (index !== -1) {
          mockPortfolios[index] = { ...mockPortfolios[index], ...data };
          return mockPortfolios[index];
        }
        throw new Error('Portfolio not found');
      },
      delete: async (id) => {
        await delay();
        const index = mockPortfolios.findIndex(p => p.id === id);
        if (index !== -1) {
          mockPortfolios.splice(index, 1);
          return true;
        }
        throw new Error('Portfolio not found');
      }
    },

    Review: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockReviews, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockReviews, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newReview = {
          ...data,
          id: `rev-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockReviews.push(newReview);
        return newReview;
      }
    },

    Dispute: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockDisputes, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockDisputes, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newDispute = {
          ...data,
          id: `disp-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockDisputes.push(newDispute);
        return newDispute;
      },
      update: async (id, data) => {
        await delay();
        const index = mockDisputes.findIndex(d => d.id === id);
        if (index !== -1) {
          mockDisputes[index] = { ...mockDisputes[index], ...data };
          return mockDisputes[index];
        }
        throw new Error('Dispute not found');
      }
    },

    Report: {
      filter: async (filterObj, sortField, limit) => {
        await delay();
        let data = filterData(mockReports, filterObj);
        data = sortData(data, sortField);
        data = limitData(data, limit);
        return data;
      },
      list: async (sortField, limit) => {
        await delay();
        let data = sortData(mockReports, sortField);
        data = limitData(data, limit);
        return data;
      },
      create: async (data) => {
        await delay();
        const newReport = {
          ...data,
          id: `rep-${Date.now()}`,
          created_date: new Date().toISOString()
        };
        mockReports.push(newReport);
        return newReport;
      },
      update: async (id, data) => {
        await delay();
        const index = mockReports.findIndex(r => r.id === id);
        if (index !== -1) {
          mockReports[index] = { ...mockReports[index], ...data };
          return mockReports[index];
        }
        throw new Error('Report not found');
      }
    }
  }
};</content>
<parameter name="filePath">c:\Users\ibayj\Development\New\studihire\src\api\mockBase44Client.js

