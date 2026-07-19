import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Doctor, ConsultationMode } from './models/Doctor.js';
import { BlogPost } from './models/BlogPost.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medimind';

const doctorsData = [
  {
    name: "Dr. Sarah Jenkins",
    specialty: "Cardiology",
    subSpecialties: ["Heart Failure", "Echocardiography"],
    location: "New York, NY",
    consultationMode: ConsultationMode.Both,
    rating: 4.8,
    reviewCount: 124,
    verified: true,
    imageUrl: "https://ui-avatars.com/api/?name=Sarah+Jenkins"
  },
  {
    name: "Dr. Michael Chen",
    specialty: "Dermatology",
    subSpecialties: ["Cosmetic Dermatology", "Skin Cancer"],
    location: "San Francisco, CA",
    consultationMode: ConsultationMode.Video,
    rating: 4.9,
    reviewCount: 342,
    verified: true,
    imageUrl: "https://ui-avatars.com/api/?name=Michael+Chen"
  },
  {
    name: "Dr. Emily Rodriguez",
    specialty: "Neurology",
    subSpecialties: ["Migraines", "Epilepsy"],
    location: "Chicago, IL",
    consultationMode: ConsultationMode.InPerson,
    rating: 4.7,
    reviewCount: 89,
    verified: true,
    imageUrl: "https://ui-avatars.com/api/?name=Emily+Rodriguez"
  },
  {
    name: "Dr. James Wilson",
    specialty: "General Practice",
    subSpecialties: ["Preventive Care", "Family Medicine"],
    location: "Austin, TX",
    consultationMode: ConsultationMode.Both,
    rating: 4.6,
    reviewCount: 210,
    verified: true,
    imageUrl: "https://ui-avatars.com/api/?name=James+Wilson"
  },
  {
    name: "Dr. Olivia Martinez",
    specialty: "Pediatrics",
    subSpecialties: ["Neonatology", "Adolescent Medicine"],
    location: "Miami, FL",
    consultationMode: ConsultationMode.InPerson,
    rating: 4.9,
    reviewCount: 156,
    verified: true,
    imageUrl: "https://ui-avatars.com/api/?name=Olivia+Martinez"
  },
  {
    name: "Dr. David Kim",
    specialty: "Psychiatry",
    subSpecialties: ["Anxiety Disorders", "Depression"],
    location: "Seattle, WA",
    consultationMode: ConsultationMode.Video,
    rating: 4.8,
    reviewCount: 112,
    verified: true,
    imageUrl: "https://ui-avatars.com/api/?name=David+Kim"
  },
  {
    name: "Dr. Anna Smith",
    specialty: "Endocrinology",
    subSpecialties: ["Diabetes", "Thyroid Disorders"],
    location: "Boston, MA",
    consultationMode: ConsultationMode.Both,
    rating: 4.7,
    reviewCount: 95,
    verified: true,
    imageUrl: "https://ui-avatars.com/api/?name=Anna+Smith"
  },
  {
    name: "Dr. Robert Taylor",
    specialty: "Orthopedics",
    subSpecialties: ["Sports Medicine", "Joint Replacement"],
    location: "Denver, CO",
    consultationMode: ConsultationMode.InPerson,
    rating: 4.5,
    reviewCount: 78,
    verified: true,
    imageUrl: "https://ui-avatars.com/api/?name=Robert+Taylor"
  },
  {
    name: "Dr. Jessica Davis",
    specialty: "Gynecology",
    subSpecialties: ["Obstetrics", "Reproductive Endocrinology"],
    location: "Atlanta, GA",
    consultationMode: ConsultationMode.Both,
    rating: 4.9,
    reviewCount: 204,
    verified: true,
    imageUrl: "https://ui-avatars.com/api/?name=Jessica+Davis"
  },
  {
    name: "Dr. William Brown",
    specialty: "Ophthalmology",
    subSpecialties: ["Glaucoma", "Cataract Surgery"],
    location: "Phoenix, AZ",
    consultationMode: ConsultationMode.InPerson,
    rating: 4.6,
    reviewCount: 132,
    verified: true,
    imageUrl: "https://ui-avatars.com/api/?name=William+Brown"
  },
  {
    name: "Dr. Sophia Garcia",
    specialty: "Gastroenterology",
    subSpecialties: ["IBD", "Hepatology"],
    location: "Los Angeles, CA",
    consultationMode: ConsultationMode.Video,
    rating: 4.8,
    reviewCount: 167,
    verified: true,
    imageUrl: "https://ui-avatars.com/api/?name=Sophia+Garcia"
  },
  {
    name: "Dr. John Clark",
    specialty: "Urology",
    subSpecialties: ["Men's Health", "Urologic Oncology"],
    location: "Dallas, TX",
    consultationMode: ConsultationMode.Both,
    rating: 4.7,
    reviewCount: 88,
    verified: true,
    imageUrl: "https://ui-avatars.com/api/?name=John+Clark"
  }
];

const blogPostsData = [
  {
    title: "Understanding Migraines: Triggers and Treatments",
    slug: "understanding-migraines-triggers-treatments",
    excerpt: "Learn about the common triggers for migraines and explore various treatment options available.",
    content: "Migraines are more than just a bad headache. They can be debilitating. Triggers can include stress, lack of sleep, or certain foods. Treatments range from lifestyle changes to specific medications designed to stop migraines in their tracks.",
    category: "Neurology",
    tags: ["Migraine", "Headache", "Neurology"],
    coverImageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    readTimeMinutes: 5,
    publishedAt: new Date()
  },
  {
    title: "The Importance of Preventive Health Screenings",
    slug: "importance-preventive-health-screenings",
    excerpt: "Discover why regular health screenings are crucial for maintaining long-term health and catching issues early.",
    content: "Preventive health screenings can save lives by detecting conditions early when they are most treatable. Regular check-ups, blood tests, and age-appropriate screenings for cancer and heart disease form the cornerstone of a good preventive healthcare plan.",
    category: "Wellness",
    tags: ["Prevention", "Screening", "Health"],
    coverImageUrl: "https://images.unsplash.com/photo-1576091160550-2173ff9e5eb3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    readTimeMinutes: 4,
    publishedAt: new Date(Date.now() - 86400000) // 1 day ago
  },
  {
    title: "Managing Anxiety in a Fast-Paced World",
    slug: "managing-anxiety-fast-paced-world",
    excerpt: "Practical tips and strategies for coping with anxiety and reducing stress in our busy modern lives.",
    content: "Anxiety is a common response to stress, but when it becomes overwhelming, it can affect your quality of life. Techniques such as mindfulness meditation, regular exercise, and cognitive-behavioral therapy can be highly effective in managing daily anxiety.",
    category: "Mental Health",
    tags: ["Anxiety", "Mental Health", "Stress"],
    coverImageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    readTimeMinutes: 6,
    publishedAt: new Date(Date.now() - 172800000) // 2 days ago
  }
];

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing collections
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await BlogPost.deleteMany({});
    console.log('Cleared existing data');

    // Create demo user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo1234', salt);
    
    // BetterAuth expects specific fields, we add password directly to user document
    const demoUser = await User.create({
      name: "Demo User",
      email: "demo@medimind.com",
      emailVerified: true,
      password: hashedPassword, // Added directly to user doc
      image: "https://ui-avatars.com/api/?name=Demo+User"
    });
    console.log('Created demo user: demo@medimind.com / demo1234');

    // Assign createdBy to doctors
    const doctorsWithUser = doctorsData.map(doc => ({
      ...doc,
      createdBy: demoUser._id
    }));

    // Insert doctors
    await Doctor.insertMany(doctorsWithUser);
    console.log(`Created ${doctorsWithUser.length} doctors`);

    // Insert blog posts
    await BlogPost.insertMany(blogPostsData);
    console.log(`Created ${blogPostsData.length} blog posts`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
