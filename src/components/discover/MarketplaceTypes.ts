export interface Store {
  id: string;
  ownerId: string;
  name: string;
  username: string;
  logo: string;
  cover: string;
  description: string;
  category: string;
  contactInfo: string;
  location?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappUrl?: string;
  telegramUrl?: string;
  youtubeUrl?: string;
  followers?: string[]; // Array of user profile IDs
  productsCount?: number;
  avgRating?: number;
  totalReviews?: number;
  isVerified?: boolean;
  createdAt?: any;
}

export interface ProductMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
}

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  storeLogo: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  stockStatus: 'available' | 'out_of_stock';
  variants?: string[]; // List of variants, e.g. ["128GB", "256GB"] or ["Red", "Blue"]
  tags?: string[];
  mediaItems: ProductMediaItem[];
  isVerified?: boolean;
  createdAt?: any;
}

export interface StorePost {
  id: string;
  storeId: string;
  storeName: string;
  storeLogo: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likesCount?: number;
  likedBy?: string[];
  commentsCount?: number;
  isVerified?: boolean;
  createdAt?: any;
}

export interface Service {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  title: string;
  description: string;
  pricing: string; // e.g., "From ৳5,000"
  portfolioUrls: string[]; // Portfolio photos/videos
  contactEmail?: string;
  contactPhone?: string;
  whatsappUrl?: string;
  category: string;
  createdAt?: any;
}

export interface StoreReview {
  id: string;
  storeId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number; // 1-5
  comment: string;
  reply?: string; // owner response
  verified?: boolean;
  createdAt?: any;
}

export interface StoreChat {
  id: string;
  storeId: string;
  storeName: string;
  storeLogo?: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  lastMessage: string;
  lastMessageAt: any;
  chatCategory: 'personal' | 'store' | 'support';
  productContext?: {
    id: string;
    name: string;
    price: number;
    thumb: string;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerUids: string[]; // owner UIDs of every store involved, denormalized at creation for security rules
  items: any[];
  subtotalBDT: number; 
  discountAmountBDT: number; 
  deliveryFeeBDT: number; 
  taxAmountBDT: number; 
  grandTotalBDT: number;
  currency: string; 
  currencySymbol: string; 
  currencyRate: number;
  shippingAddress: { 
    fullName: string; 
    addressLine: string; 
    phone: string; 
    city: string; 
    postalCode: string 
  };
  deliveryMethod: string;
  gateway: string;
  createdAt: any;
  trackingTimeline: { 
    status: string; 
    label: string; 
    date: string; 
    desc: string; 
    active: boolean 
  }[];
  currentStatus: 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  refundStatus?: 'none' | 'requested' | 'approved' | 'rejected';
  refundReason?: string;
}

// Global Categories Config
export const MARKETPLACE_CATEGORIES = [
  { id: 'Electronics', label: 'Electronics', icon: 'Laptop' },
  { id: 'Fashion', label: 'Fashion', icon: 'Shirt' },
  { id: 'Beauty', label: 'Beauty & Health', icon: 'Sparkles' },
  { id: 'Food', label: 'Food & Groceries', icon: 'Pizza' },
  { id: 'Furniture', label: 'Furniture & Decor', icon: 'Sofa' },
  { id: 'Automotive', label: 'Automotive', icon: 'Car' },
  { id: 'Digital Products', label: 'Digital Products', icon: 'FileCode' },
  { id: 'Services', label: 'Services', icon: 'Briefcase' },
  { id: 'Home & Living', label: 'Home & Living', icon: 'Home' },
  { id: 'Books', label: 'Books & Stationery', icon: 'BookOpen' },
  { id: 'Sports', label: 'Sports & Fitness', icon: 'Dumbbell' }
];

// Rich Seed Data to guarantee a gorgeous display when no records exist
export const SEED_STORES: Store[] = [
  {
    id: 'store_seed_1',
    ownerId: 'seed_user_1',
    name: 'Jim Electronics',
    username: 'jimelectronics',
    logo: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=150&q=80',
    cover: 'https://images.unsplash.com/photo-1468495244122-c300e423b47b?auto=format&fit=crop&w=1200&q=80',
    description: 'Premier retail and bulk destination for flagship electronics, verified hardware, and pristine smart devices. Elevating your tech arsenal.',
    category: 'Electronics',
    contactInfo: '01712-345678 | info@jimelectronics.com',
    location: 'Mirpur-10, Dhaka, Bangladesh',
    websiteUrl: 'https://jimelectronics.com',
    facebookUrl: 'https://facebook.com/jimelectronics',
    instagramUrl: 'https://instagram.com/jimelectronics',
    whatsappUrl: 'https://wa.me/8801712345678',
    telegramUrl: 'https://t.me/jimelectronics',
    followers: ['user_follower_1', 'user_follower_2']
  },
  {
    id: 'store_seed_2',
    ownerId: 'seed_user_2',
    name: 'Fashion Hub',
    username: 'fashionhub',
    logo: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=150&q=80',
    cover: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    description: 'Minimalist contemporary aesthetics and comfortable premium materials. Designed for creators with a curated edge.',
    category: 'Fashion',
    contactInfo: '01811-987654 | sales@fashionhub.com',
    location: 'Banani, Road 11, Dhaka',
    instagramUrl: 'https://instagram.com/fashionhubhub',
    whatsappUrl: 'https://wa.me/8801811987654',
    followers: ['user_follower_3']
  }
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_seed_1',
    storeId: 'store_seed_1',
    storeName: 'Jim Electronics',
    storeLogo: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=150&q=80',
    name: 'iPhone 15 Pro Max',
    description: 'Prismatic titanium flagship featuring custom dynamic island, enhanced telephoto lenses, and unmatched visual engine performance. Authentic imported unit.',
    price: 135000,
    discountPrice: 125000,
    category: 'Electronics',
    stockStatus: 'available',
    variants: ['Titanium Gray', 'Obsidian Black', 'Pristine White'],
    tags: ['iphone', 'mobile', 'flagship', 'apple'],
    mediaItems: [
      { id: 'm1', type: 'image', url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80' },
      { id: 'm2', type: 'image', url: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&w=600&q=80' }
    ]
  },
  {
    id: 'prod_seed_2',
    storeId: 'store_seed_2',
    storeName: 'Fashion Hub',
    storeLogo: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=150&q=80',
    name: 'Oversized Sandstone Trenchcoat',
    description: 'Heavyweight organic cotton drape styled in vintage sandstone. Structured cuffs, deep cargo lining pockets, and storm wind protection.',
    price: 8500,
    discountPrice: 6200,
    category: 'Fashion',
    stockStatus: 'available',
    variants: ['Sandstone S', 'Sandstone M', 'Sandstone L'],
    tags: ['outerwear', 'minimal', 'unisex', 'trench'],
    mediaItems: [
      { id: 'm3', type: 'image', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80' }
    ]
  }
];

export const SEED_SERVICES: Service[] = [
  {
    id: 'srv_seed_1',
    ownerId: 'seed_user_3',
    ownerName: 'Tanvir Rahman',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    title: 'Minimal Brand Architecture & Identity Design',
    description: 'Transforming businesses with custom geometric logo sets, robust design systems, type rules, and vector guidelines for packaging.',
    pricing: 'From ৳25,000',
    portfolioUrls: [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=500&q=80'
    ],
    contactEmail: 'tanvir@fashiondesigns.com',
    contactPhone: '01912-112233',
    whatsappUrl: 'https://wa.me/8801912112233',
    category: 'Services'
  }
];

export const SEED_STORE_POSTS: StorePost[] = [
  {
    id: 'post_seed_1',
    storeId: 'store_seed_2',
    storeName: 'Fashion Hub',
    storeLogo: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=150&q=80',
    content: '🍂 New Autumn Drop launching tonight! Use code FASHION15 for early-bird reservation slots on our Sandstone Series. Limited run sizes.',
    mediaUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    mediaType: 'image',
    likesCount: 34,
    commentsCount: 3
  }
];

export const SEED_STORE_REVIEWS: StoreReview[] = [
  {
    id: 'rev_seed_1',
    storeId: 'store_seed_1',
    userId: 'reviewer_1',
    userName: '@nabil_khan',
    userAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&q=80',
    rating: 5,
    comment: 'Authentic iPhone 15 Pro received. Verified the serial. Store owner Jim is highly cooperative and the warranty terms are super clear.',
    reply: 'Thank you Nabil! Pleased to deliver genuine service.',
    createdAt: new Date().toISOString()
  }
];
