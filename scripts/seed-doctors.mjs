import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const doctors = [
  {
    name: "Dr. Priya Sharma",
    specialization: "Psychiatrist",
    rating: 48,
    review_count: 124,
    availability: "Mon-Sat, 10AM-6PM",
    location: "Indore, Madhya Pradesh",
    phone: "+91-731-2345678",
    email: "priya.sharma@mentalmate.in",
    image_url: "https://api.dicebear.com/7.x/personas/svg?seed=priya",
    bio: "Dr. Priya Sharma is a experienced psychiatrist with 12 years of experience treating anxiety, depression, and stress disorders.",
    accepting_patients: true,
  },
  {
    name: "Dr. Rahul Verma",
    specialization: "Clinical Psychologist",
    rating: 46,
    review_count: 89,
    availability: "Mon-Fri, 9AM-5PM",
    location: "Indore, Madhya Pradesh",
    phone: "+91-731-3456789",
    email: "rahul.verma@mentalmate.in",
    image_url: "https://api.dicebear.com/7.x/personas/svg?seed=rahul",
    bio: "Dr. Rahul Verma specializes in cognitive behavioral therapy and has helped hundreds of patients overcome mental health challenges.",
    accepting_patients: true,
  },
  {
    name: "Dr. Anjali Patel",
    specialization: "Therapist",
    rating: 49,
    review_count: 203,
    availability: "Tue-Sun, 11AM-7PM",
    location: "Bhopal, Madhya Pradesh",
    phone: "+91-755-2345678",
    email: "anjali.patel@mentalmate.in",
    image_url: "https://api.dicebear.com/7.x/personas/svg?seed=anjali",
    bio: "Dr. Anjali Patel is a certified therapist specializing in trauma, relationship issues, and mindfulness-based therapy.",
    accepting_patients: true,
  },
  {
    name: "Dr. Vikram Singh",
    specialization: "Psychiatrist",
    rating: 45,
    review_count: 67,
    availability: "Mon-Sat, 8AM-4PM",
    location: "Bhopal, Madhya Pradesh",
    phone: "+91-755-3456789",
    email: "vikram.singh@mentalmate.in",
    image_url: "https://api.dicebear.com/7.x/personas/svg?seed=vikram",
    bio: "Dr. Vikram Singh focuses on mood disorders, ADHD, and adolescent mental health with a patient-centered approach.",
    accepting_patients: false,
  },
  {
    name: "Dr. Meera Joshi",
    specialization: "Counselor",
    rating: 47,
    review_count: 156,
    availability: "Mon-Fri, 10AM-6PM",
    location: "Mumbai, Maharashtra",
    phone: "+91-22-23456789",
    email: "meera.joshi@mentalmate.in",
    image_url: "https://api.dicebear.com/7.x/personas/svg?seed=meera",
    bio: "Dr. Meera Joshi is a licensed counselor with expertise in stress management, grief counseling, and work-life balance.",
    accepting_patients: true,
  },
  {
    name: "Dr. Arjun Nair",
    specialization: "Clinical Psychologist",
    rating: 50,
    review_count: 312,
    availability: "Mon-Sat, 9AM-7PM",
    location: "Mumbai, Maharashtra",
    phone: "+91-22-34567890",
    email: "arjun.nair@mentalmate.in",
    image_url: "https://api.dicebear.com/7.x/personas/svg?seed=arjun",
    bio: "Dr. Arjun Nair is one of Mumbai's top rated psychologists specializing in anxiety disorders and psychotherapy.",
    accepting_patients: true,
  },
  {
    name: "Dr. Sunita Reddy",
    specialization: "Psychiatrist",
    rating: 46,
    review_count: 178,
    availability: "Tue-Sun, 10AM-5PM",
    location: "Hyderabad, Telangana",
    phone: "+91-40-23456789",
    email: "sunita.reddy@mentalmate.in",
    image_url: "https://api.dicebear.com/7.x/personas/svg?seed=sunita",
    bio: "Dr. Sunita Reddy has 15 years of experience in treating depression, bipolar disorder, and schizophrenia.",
    accepting_patients: true,
  },
  {
    name: "Dr. Karan Mehta",
    specialization: "Therapist",
    rating: 44,
    review_count: 92,
    availability: "Mon-Fri, 11AM-8PM",
    location: "Delhi, NCR",
    phone: "+91-11-23456789",
    email: "karan.mehta@mentalmate.in",
    image_url: "https://api.dicebear.com/7.x/personas/svg?seed=karan",
    bio: "Dr. Karan Mehta specializes in family therapy, couples counseling, and adolescent mental health issues.",
    accepting_patients: true,
  },
  {
    name: "Dr. Pooja Gupta",
    specialization: "Counselor",
    rating: 48,
    review_count: 241,
    availability: "Mon-Sat, 9AM-6PM",
    location: "Delhi, NCR",
    phone: "+91-11-34567890",
    email: "pooja.gupta@mentalmate.in",
    image_url: "https://api.dicebear.com/7.x/personas/svg?seed=pooja",
    bio: "Dr. Pooja Gupta is known for her compassionate approach in treating OCD, phobias, and panic disorders.",
    accepting_patients: false,
  },
  {
    name: "Dr. Ravi Kumar",
    specialization: "Psychiatrist",
    rating: 47,
    review_count: 134,
    availability: "Mon-Fri, 10AM-7PM",
    location: "Bangalore, Karnataka",
    phone: "+91-80-23456789",
    email: "ravi.kumar@mentalmate.in",
    image_url: "https://api.dicebear.com/7.x/personas/svg?seed=ravi",
    bio: "Dr. Ravi Kumar is a leading psychiatrist in Bangalore with expertise in tech-industry stress and burnout.",
    accepting_patients: true,
  },
];

async function seed() {
  await client.connect();
  console.log("Connected to database!");

  // Clear existing doctors
  await client.query("DELETE FROM doctors");
  console.log("Cleared existing doctors");

  for (const doc of doctors) {
    await client.query(
      `INSERT INTO doctors (name, specialization, rating, review_count, availability, location, phone, email, image_url, bio, accepting_patients)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [doc.name, doc.specialization, doc.rating, doc.review_count, doc.availability, doc.location, doc.phone, doc.email, doc.image_url, doc.bio, doc.accepting_patients]
    );
    console.log(`Added: ${doc.name} - ${doc.location}`);
  }

  console.log("\n✅ All doctors added successfully!");
  await client.end();
}

seed().catch(console.error);