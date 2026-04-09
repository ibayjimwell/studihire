// Mock Base44 Client for hardcoded data
// This replaces the real Base44 SDK with dummy data to showcase the UI

import { generateMockData } from "./mockData.js";

// Initialize mock data
const data = generateMockData();

// Mock User Data
const mockUsers = data.mockUsers;

// Mock Student Profiles
const mockStudentProfiles = data.mockStudentProfiles;

// Mock Client Profiles
const mockClientProfiles = data.mockClientProfiles;

// Mock Gigs
const mockGigs = data.mockGigs;

// Mock Projects
const mockProjects = data.mockProjects;

// Mock Orders
const mockOrders = data.mockOrders;

// Mock Payments
const mockPayments = data.mockPayments;

// Mock Conversations
const mockConversations = data.mockConversations;

// Mock Messages
const mockMessages = data.mockMessages;

// Mock Notifications
const mockNotifications = data.mockNotifications;

// Mock Portfolio
const mockPortfolios = data.mockPortfolios;

// Mock Reviews
const mockReviews = data.mockReviews;

// Mock Disputes
const mockDisputes = data.mockDisputes;

// Mock Reports
const mockReports = data.mockReports;

// Helper functions
const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

const filterData = (data, filterObj) => {
  if (!filterObj || Object.keys(filterObj).length === 0) return data;
  return data.filter((item) => {
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
  const isDesc = sortField.startsWith("-");
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
      // Get current role from localStorage
      const userRole = localStorage.getItem("mockUserRole") || "student";

      // Return the appropriate user based on role
      if (userRole === "admin") {
        return {
          id: "user-3",
          email: "admin@example.com",
          full_name: "Admin User",
          role: "admin",
        };
      } else if (userRole === "client") {
        return {
          id: "user-2",
          email: "jane.smith@example.com",
          full_name: "Jane Smith",
          role: "client",
        };
      } else {
        return {
          id: "user-1",
          email: "john.doe@example.com",
          full_name: "John Doe",
          role: "student",
        };
      }
    },
    logout: async (redirectPath = "/") => {
      await delay();
      // In a real app, this would clear tokens
      window.location.href = redirectPath;
    },
  },

  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        await delay(500); // Simulate upload time
        return {
          file_url: `https://via.placeholder.com/400x300?text=${file.name || "Uploaded File"}`,
        };
      },
      InvokeLLM: async ({ prompt, file_urls, response_json_schema }) => {
        await delay(1000); // Simulate AI processing
        // Mock resume parsing result
        return {
          full_name: "John Doe",
          email: "john.doe@example.com",
          phone: "+1234567890",
          skills: ["JavaScript", "React", "Node.js", "Python"],
          education: [
            {
              degree: "Bachelor of Science in Computer Science",
              institution: "University of Example",
              year: 2024,
            },
          ],
          work_experience: [
            {
              title: "Intern Developer",
              company: "Tech Corp",
              duration: "Jan 2023 - Jun 2023",
              description: "Developed web applications",
            },
          ],
        };
      },
    },
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
          created_date: new Date().toISOString(),
        };
        mockStudentProfiles.push(newProfile);
        return newProfile;
      },
      update: async (id, data) => {
        await delay();
        const index = mockStudentProfiles.findIndex((p) => p.id === id);
        if (index !== -1) {
          mockStudentProfiles[index] = {
            ...mockStudentProfiles[index],
            ...data,
          };
          return mockStudentProfiles[index];
        }
        throw new Error("Profile not found");
      },
      delete: async (id) => {
        await delay();
        const index = mockStudentProfiles.findIndex((p) => p.id === id);
        if (index !== -1) {
          mockStudentProfiles.splice(index, 1);
          return true;
        }
        throw new Error("Profile not found");
      },
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
          created_date: new Date().toISOString(),
        };
        mockClientProfiles.push(newProfile);
        return newProfile;
      },
      update: async (id, data) => {
        await delay();
        const index = mockClientProfiles.findIndex((p) => p.id === id);
        if (index !== -1) {
          mockClientProfiles[index] = { ...mockClientProfiles[index], ...data };
          return mockClientProfiles[index];
        }
        throw new Error("Profile not found");
      },
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
          created_date: new Date().toISOString(),
        };
        mockGigs.push(newGig);
        return newGig;
      },
      update: async (id, data) => {
        await delay();
        const index = mockGigs.findIndex((g) => g.id === id);
        if (index !== -1) {
          mockGigs[index] = { ...mockGigs[index], ...data };
          return mockGigs[index];
        }
        throw new Error("Gig not found");
      },
      delete: async (id) => {
        await delay();
        const index = mockGigs.findIndex((g) => g.id === id);
        if (index !== -1) {
          mockGigs.splice(index, 1);
          return true;
        }
        throw new Error("Gig not found");
      },
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
          created_date: new Date().toISOString(),
        };
        mockProjects.push(newProject);
        return newProject;
      },
      update: async (id, data) => {
        await delay();
        const index = mockProjects.findIndex((p) => p.id === id);
        if (index !== -1) {
          mockProjects[index] = { ...mockProjects[index], ...data };
          return mockProjects[index];
        }
        throw new Error("Project not found");
      },
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
          created_date: new Date().toISOString(),
        };
        mockOrders.push(newOrder);
        return newOrder;
      },
      update: async (id, data) => {
        await delay();
        const index = mockOrders.findIndex((o) => o.id === id);
        if (index !== -1) {
          mockOrders[index] = { ...mockOrders[index], ...data };
          return mockOrders[index];
        }
        throw new Error("Order not found");
      },
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
          created_date: new Date().toISOString(),
        };
        mockPayments.push(newPayment);
        return newPayment;
      },
      update: async (id, data) => {
        await delay();
        const index = mockPayments.findIndex((p) => p.id === id);
        if (index !== -1) {
          mockPayments[index] = { ...mockPayments[index], ...data };
          return mockPayments[index];
        }
        throw new Error("Payment not found");
      },
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
          created_date: new Date().toISOString(),
        };
        mockConversations.push(newConv);
        return newConv;
      },
      update: async (id, data) => {
        await delay();
        const index = mockConversations.findIndex((c) => c.id === id);
        if (index !== -1) {
          mockConversations[index] = { ...mockConversations[index], ...data };
          return mockConversations[index];
        }
        throw new Error("Conversation not found");
      },
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
          created_date: new Date().toISOString(),
        };
        mockMessages.push(newMessage);
        return newMessage;
      },
      subscribe: (callback) => {
        // Mock subscription - in real app this would be WebSocket
        // For demo, just return unsubscribe function
        return () => {};
      },
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
          created_date: new Date().toISOString(),
        };
        mockNotifications.push(newNotif);
        return newNotif;
      },
      update: async (id, data) => {
        await delay();
        const index = mockNotifications.findIndex((n) => n.id === id);
        if (index !== -1) {
          mockNotifications[index] = { ...mockNotifications[index], ...data };
          return mockNotifications[index];
        }
        throw new Error("Notification not found");
      },
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
          created_date: new Date().toISOString(),
        };
        mockPortfolios.push(newPortfolio);
        return newPortfolio;
      },
      update: async (id, data) => {
        await delay();
        const index = mockPortfolios.findIndex((p) => p.id === id);
        if (index !== -1) {
          mockPortfolios[index] = { ...mockPortfolios[index], ...data };
          return mockPortfolios[index];
        }
        throw new Error("Portfolio not found");
      },
      delete: async (id) => {
        await delay();
        const index = mockPortfolios.findIndex((p) => p.id === id);
        if (index !== -1) {
          mockPortfolios.splice(index, 1);
          return true;
        }
        throw new Error("Portfolio not found");
      },
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
          created_date: new Date().toISOString(),
        };
        mockReviews.push(newReview);
        return newReview;
      },
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
          created_date: new Date().toISOString(),
        };
        mockDisputes.push(newDispute);
        return newDispute;
      },
      update: async (id, data) => {
        await delay();
        const index = mockDisputes.findIndex((d) => d.id === id);
        if (index !== -1) {
          mockDisputes[index] = { ...mockDisputes[index], ...data };
          return mockDisputes[index];
        }
        throw new Error("Dispute not found");
      },
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
          created_date: new Date().toISOString(),
        };
        mockReports.push(newReport);
        return newReport;
      },
      update: async (id, data) => {
        await delay();
        const index = mockReports.findIndex((r) => r.id === id);
        if (index !== -1) {
          mockReports[index] = { ...mockReports[index], ...data };
          return mockReports[index];
        }
        throw new Error("Report not found");
      },
    },
  },
};
