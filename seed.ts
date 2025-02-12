import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';


const prisma = new PrismaClient();
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

const mockRestaurants: Array<{
  name: string;
  chainName: string;
  address: string;
  latitude: number;
  longitude: number;
  cuisineType: string;
  segment: string;
  city: string;
  area: string;
  rating: number;
  coverImage: string;
  deliveryTime: string;
  minimumOrder: string;
  menuItems: Array<{
    label: string;
    description: string;
    price: number;
    image: string;
    category: string;
  }>;
  vendor: { id: string }; // Assuming vendor is part of restaurant data
}> = [
  {
    name: "Burger House",
    chainName: "Burger Chain",
    address: "123 Main St, New York, NY 10001",
    latitude: 40.7128,
    longitude: -74.0060,
    cuisineType: "American",
    segment: "Casual Dining",
    city: "New York",
    area: "Manhattan",
    rating: 4.5,
    coverImage: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800",
    deliveryTime: "25-35",
    minimumOrder: "$15",
    menuItems: [
      {
        label: "Classic Burger",
        description: "100% Angus beef patty with lettuce, tomato, and special sauce",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
        category: "Burgers"
      },
      {
        label: "Cheese Fries",
        description: "Crispy fries topped with melted cheddar",
        price: 6.99,
        image: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500",
        category: "Sides"
      },
      {
        label: "Milkshake",
        description: "Creamy vanilla milkshake",
        price: 5.99,
        image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500",
        category: "Drinks"
      }
    ],
    vendor: {
      id: ''
    }
  },
  {
    name: "Thai Spice Garden",
    chainName: "Thai Spice",
    address: "567 Park Ave, New York, NY 10065",
    latitude: 40.7681,
    longitude: -73.9649,
    cuisineType: "Thai",
    segment: "Fine Dining",
    city: "New York",
    area: "Upper East Side",
    rating: 4.7,
    coverImage: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800",
    deliveryTime: "35-45",
    minimumOrder: "$25",
    menuItems: [
      {
        label: "Pad Thai",
        description: "Rice noodles with shrimp, tofu, eggs, and peanuts in tamarind sauce",
        price: 18.99,
        image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500",
        category: "Noodles"
      },
      {
        label: "Green Curry",
        description: "Coconut curry with bamboo shoots, eggplant, and choice of protein",
        price: 19.99,
        image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500",
        category: "Curries"
      },
      {
        label: "Spring Rolls",
        description: "Crispy vegetable spring rolls with sweet chili sauce",
        price: 8.99,
        image: "https://images.unsplash.com/photo-1544601284-28e0606f6260?w=500",
        category: "Appetizers"
      },
      {
        label: "Mango Sticky Rice",
        description: "Sweet coconut sticky rice with fresh mango",
        price: 9.99,
        image: "https://images.unsplash.com/photo-1621293954908-907159247fc8?w=500",
        category: "Desserts"
      },
      {
        label: "Thai Iced Tea",
        description: "Traditional sweet and creamy Thai tea",
        price: 4.99,
        image: "https://images.unsplash.com/photo-1558857563-b371033873b8?w=500",
        category: "Beverages"
      },

      
    ],
    vendor: {
      id: ''
    }
  },
  {
    name: "Mediterranean Mezze",
    chainName: "Mezze Group",
    address: "789 Columbus Ave, New York, NY 10025",
    latitude: 40.7891,
    longitude: -73.9667,
    cuisineType: "Mediterranean",
    segment: "Casual Dining",
    city: "New York",
    area: "Upper West Side",
    rating: 4.6,
    coverImage: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800",
    deliveryTime: "30-40",
    minimumOrder: "$20",
    menuItems: [
      {
        label: "Hummus Platter",
        description: "Creamy hummus with olive oil, paprika, and warm pita",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500",
        category: "Appetizers"
      },
      {
        label: "Falafel Wrap",
        description: "Crispy falafel with tahini sauce and fresh vegetables",
        price: 14.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500",
        category: "Wraps"
      },
      {
        label: "Shawarma Plate",
        description: "Marinated chicken or lamb with rice and salad",
        price: 21.99,
        image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
        category: "Entrees"
      },
      {
        label: "Greek Salad",
        description: "Fresh vegetables with feta cheese and olives",
        price: 15.99,
        image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
        category: "Salads"
      },
      {
        label: "Baklava",
        description: "Sweet layered pastry with nuts and honey",
        price: 7.99,
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500",
        category: "Desserts"
      }
    ],
    vendor: {
      id: ''
    }
  },
  {
    name: "Indian Curry House",
    chainName: "Curry House Group",
    address: "234 Lexington Ave, New York, NY 10016",
    latitude: 40.7446,
    longitude: -73.9784,
    cuisineType: "Indian",
    segment: "Fine Dining",
    city: "New York",
    area: "Murray Hill",
    rating: 4.8,
    coverImage: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
    deliveryTime: "40-50",
    minimumOrder: "$30",
    menuItems: [
      {
        label: "Butter Chicken",
        description: "Tender chicken in rich tomato-butter sauce",
        price: 22.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500",
        category: "Main Course"
      },

      {
        label: "Chicken Tikka Masala",
        description: "Grilled chicken pieces in a savory, spiced tomato gravy, a popular Indian favorite.",
        price: 19.99,
        image: "https://images.unsplash.com/photo-1694579740719-0e601c5d2437?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        category: "Main Course"
      },
      {
        label: "Lamb Rogan Josh",
        description: "Tender lamb pieces simmered in a flavorful blend of spices, yogurt, and herbs.",
        price: 24.99,
        image: "https://images.unsplash.com/photo-1516685125522-3c528b8046ee?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        category: "Main Course"
      },

      {
        label: "Paneer Butter Masala",
        description: "Cubes of paneer cooked in a rich, creamy tomato gravy, perfect for vegetarians.",
        price: 18.99,
        image: "https://images.unsplash.com/photo-1701579231378-3726490a407b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        category: "Vegetarian"
      },
      
      {
        label: "Vegetable Biryani",
        description: "Aromatic rice with mixed vegetables and spices",
        price: 19.99,
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
        category: "Rice"
      },
      {
        label: "Garlic Naan",
        description: "Fresh bread with garlic and butter",
        price: 4.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500",
        category: "Breads"
      },
      {
        label: "Samosa",
        description: "Crispy pastry filled with spiced potatoes and peas",
        price: 6.99,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500",
        category: "Appetizers"
      },
      {
        label: "Mango Lassi",
        description: "Yogurt smoothie with mango and cardamom",
        price: 5.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500",
        category: "Beverages"
      }
    ],
    vendor: {
      id: ''
    }
  },
  {
    name: "Dim Sum Palace",
    chainName: "Palace Group",
    address: "345 Canal St, New York, NY 10013",
    latitude: 40.7196,
    longitude: -74.0044,
    cuisineType: "Chinese",
    segment: "Casual Dining",
    city: "New York",
    area: "Chinatown",
    rating: 4.5,
    coverImage: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
    deliveryTime: "30-40",
    minimumOrder: "$25",
    menuItems: [
      {
        label: "Har Gow",
        description: "Shrimp dumplings in translucent wrapper",
        price: 8.99,
        image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500",
        category: "Dumplings"
      },
      {
        label: "Siu Mai",
        description: "Pork and shrimp dumplings",
        price: 7.99,
        image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500",
        category: "Dumplings"
      },
      {
        label: "BBQ Pork Buns",
        description: "Steamed buns filled with char siu pork",
        price: 6.99,
        image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500",
        category: "Buns"
      },
      {
        label: "Egg Tarts",
        description: "Flaky pastry with sweet egg custard",
        price: 5.99,
        image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500",
        category: "Desserts"
      },
      {
        label: "Jasmine Tea",
        description: "Premium Chinese jasmine tea",
        price: 3.99,
        image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500",
        category: "Beverages"
      }
    ],
    vendor: {
      id: ''
    }
  },
  {
    name: "Korean BBQ House",
    chainName: "K-BBQ Group",
    address: "456 32nd St, New York, NY 10001",
    latitude: 40.7484,
    longitude: -73.9857,
    cuisineType: "Korean",
    segment: "Casual Dining",
    city: "New York",
    area: "Koreatown",
    rating: 4.7,
    coverImage: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
    deliveryTime: "35-45",
    minimumOrder: "$30",
    menuItems: [
      {
        label: "Bulgogi",
        description: "Marinated beef with rice and banchan",
        price: 24.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500",
        category: "BBQ"
      },
      {
        label: "Kimchi Stew",
        description: "Spicy stew with kimchi and pork",
        price: 18.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500",
        category: "Stews"
      },
      {
        label: "Bibimbap",
        description: "Rice bowl with vegetables and egg",
        price: 16.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500",
        category: "Rice Dishes"
      },
      {
        label: "Korean Fried Chicken",
        description: "Crispy chicken with sweet and spicy sauce",
        price: 19.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500",
        category: "Chicken"
      },
      {
        label: "Soju",
        description: "Traditional Korean rice liquor",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500",
        category: "Beverages"
      }
      ],
      vendor: {
        id: ''
      }
    }];

const mockVendors = [
  {
    email: 'vendor1@example.com',
    password: 'password',
    name: 'John Smith',
    businessName: 'BurgerChain Express',
    documents: { businessLicense: 'https://example.com/license1.pdf' }
  },
  {
    email: 'vendor2@example.com',
    password: 'password',
    name: 'Mike Johnson',
    businessName: 'HotBurger Palace',
    documents: { businessLicense: 'https://example.com/license2.pdf' }
  },
  {
    email: 'vendor3@example.com',
    password: 'password',
    name: 'Sarah Wilson',
    businessName: 'Spicy Wings Hub',
    documents: { businessLicense: 'https://example.com/license3.pdf' }
  },
  {
    email: 'vendor4@example.com',
    password: 'password',
    name: 'David Brown',
    businessName: 'Pizza Paradise',
    documents: { businessLicense: 'https://example.com/license4.pdf' }
  },
  {
    email: 'vendor5@example.com',
    password: 'password',
    name: 'Lisa Anderson',
    businessName: 'Taco Express',
    documents: { businessLicense: 'https://example.com/license5.pdf' }
  }];

const mockDrivers = [
  {
    email: 'driver1@example.com',
    password: 'password',
    name: 'Driver One',
    vehicleType: 'Car',
    documents: { license: 'https://example.com/license1.pdf' }
  },
  {
    email: 'driver2@example.com',
    password: 'password',
    name: 'Driver Two',
    vehicleType: 'Bike',
    documents: { license: 'https://example.com/license2.pdf' }
  }
];

const superAdmin: {
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN';
} = {
  email: 'superadmin@example.com',
  password: 'password',
  name: 'Super Admin',
  role: 'SUPER_ADMIN'
};

async function createSupabaseUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw new Error(`Error creating Supabase user: ${error.message}`);
  }
  return data.user?.id;
}
async function main() {
  console.log('Start seeding...');

  // Delete existing data in correct order
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.driverLocation.deleteMany();
  await prisma.driverStats.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

    // After creating vendors, you can map them to restaurants
const vendorIds: string[] = []; // Store vendor IDs for mapping 
  for (const vendorData of mockVendors) {
    const userId = await createSupabaseUser(vendorData.email, vendorData.password);
    
    if (userId) {
      const vendorProfile = await prisma.user.create({
        data: {
          id: userId,
          email: vendorData.email,
          name: vendorData.name,
          role: 'VENDOR',
          approvalStatus: 'APPROVED',
          vendorProfile: {
            create: {
              businessName: vendorData.businessName,
              documents: vendorData.documents
            }
          }
        },
        include: {
          vendorProfile: true
        }
      });
      if (vendorProfile.vendorProfile) {
        vendorIds.push(vendorProfile.vendorProfile.id); // Store the vendor ID
        console.log(`Created vendor user with id: ${vendorProfile.id}`);
      } else {
        console.error(`Failed to create vendor profile for user: ${vendorProfile.id}`);
      }
    }
  }

  // Create drivers
  for (const driverData of mockDrivers) {
    const userId = await createSupabaseUser(driverData.email, driverData.password);
    if (userId) {
      await prisma.user.create({
        data: {
          id: userId,
          email: driverData.email,
          name: driverData.name,
          role: 'DRIVER',
          approvalStatus: 'APPROVED',
          driver: {
            create: {
              vehicleType: driverData.vehicleType,
              documents: driverData.documents
            }
          }
        }
      });
      console.log(`Created driver with id: ${userId}`);
    }
  }
 

  if (vendorIds.length === 0) {
    throw new Error("No Vendor IDs available. Ensure vendor profiles are created successfully.");
  }
  
  const updatedMockRestaurants = mockRestaurants.map((restaurant, index) => ({
    ...restaurant,
    vendor: {
      id: vendorIds[index % vendorIds.length], // Assign vendor IDs cyclically
    },
  }));
  
  // Add debug logs to confirm assignment
  updatedMockRestaurants.forEach((restaurant, index) => {
    console.log(`Assigning restaurant '${restaurant.name}' to vendor ID: ${restaurant.vendor.id} (${mockVendors[index % mockVendors.length].name})`);
  });
  
  
  // Create restaurants
  for (const restaurantData of updatedMockRestaurants) {
    const { menuItems, ...restaurantInfo } = restaurantData;
  
    try {

      const vendorExists = await prisma.vendorProfile.findUnique({
        where: { id: restaurantData.vendor.id },
      });
  
      if (!vendorExists) {
        console.error(
          `Vendor ID '${restaurantData.vendor.id}' does not exist. Skipping restaurant '${restaurantData.name}'.`
        );
        continue;
      }
      
      const restaurant = await prisma.restaurant.create({
        data: {
          ...restaurantInfo,
          vendor: {
            connect: { id: restaurantData.vendor.id }, // Ensure this ID exists
          },
          menuItems: {
            create: menuItems,
          },
        },
      });
      console.log(`Created restaurant '${restaurant.name}' with id: ${restaurant.id}`);
    } catch (error) {
      console.error(`Failed to create restaurant '${restaurantData.name}' with vendor ID: ${restaurantData.vendor.id}`, error);
    }
  }


  // Create super admin
  const superAdminId = await createSupabaseUser(superAdmin.email, superAdmin.password);
  if (superAdminId) {
    await prisma.user.create({
      data: {
        id: superAdminId,
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role
      }
    });
    console.log(`Created super admin with id: ${superAdminId}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });