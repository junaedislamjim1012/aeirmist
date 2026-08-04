import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Store, 
  Edit3, 
  ShoppingBag, 
  Trash2, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  PlusCircle, 
  ArrowLeftRight, 
  Settings, 
  Megaphone, 
  MessageSquare, 
  CheckCircle,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoveLeft,
  MoveRight
} from 'lucide-react';
import { useAeirmist } from '../../context/AeirmistContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getAvatarUrl } from '../../lib/avatar';
import { 
  Store as StoreType, 
  Product, 
  ProductMediaItem,
  MARKETPLACE_CATEGORIES 
} from './MarketplaceTypes';
import { MarketplaceBusinessInbox } from './MarketplaceBusinessInbox';
import { MarketplaceWritingHelper } from './MarketplaceWritingHelper';

interface DashboardProps {
  onViewStore: (store: StoreType) => void;
}

export const MarketplaceDashboard: React.FC<DashboardProps> = ({ onViewStore }) => {
  const { db, profile, addToast, earnPoints, uploadMedia } = useAeirmist();

  // Screen level states
  const [myStores, setMyStores] = useState<StoreType[]>([]);
  const [activeStore, setActiveStore] = useState<StoreType | null>(null);
  const [loading, setLoading] = useState(true);

  // Forms controllers
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Active sub tab inside active store dashboard
  const [subTab, setSubTab] = useState<'products' | 'posts' | 'inbox' | 'setup'>('products');

  // Firestore lists
  const [productsList, setProductsList] = useState<Product[]>([]);

  // Media Manager lists (for product upload preview)
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingState, setUploadingState] = useState('');
  const [tempMediaItems, setTempMediaItems] = useState<ProductMediaItem[]>([]);

  // Store form fields
  const [storeName, setStoreName] = useState('');
  const [storeUsername, setStoreUsername] = useState('');
  const [storeLogo, setStoreLogo] = useState('');
  const [storeCover, setStoreCover] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [storeCategory, setStoreCategory] = useState(MARKETPLACE_CATEGORIES[0].id);
  const [storeContact, setStoreContact] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [storeWebsite, setStoreWebsite] = useState('');
  const [storeFb, setStoreFb] = useState('');
  const [storeInsta, setStoreInsta] = useState('');
  const [storeWa, setStoreWa] = useState('');
  const [storeTelegram, setStoreTelegram] = useState('');
  const [storeYt, setStoreYt] = useState('');

  // Product form fields
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDiscount, setProdDiscount] = useState('');
  const [prodCategory, setProdCategory] = useState(MARKETPLACE_CATEGORIES[0].id);
  const [prodStock, setProdStock] = useState<'available' | 'out_of_stock'>('available');
  const [prodVariants, setProdVariants] = useState('');
  const [prodTags, setProdTags] = useState('');

  // Post composer state
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState('');
  const [postMediaType, setPostMediaType] = useState<'image' | 'video'>('image');
  const [isPublishingPost, setIsPublishingPost] = useState(false);

  // Load owned stores from firestore
  useEffect(() => {
    if (!db || !profile) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'stores'), where('ownerId', '==', profile.id));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreType));
      setMyStores(list);
      
      // select first if activeStore is not set or not in list
      if (list.length > 0) {
        if (!activeStore || !list.find(s => s.id === activeStore.id)) {
          setActiveStore(list[0]);
        } else {
          // keep activeStore updated with fresh data
          const fresh = list.find(s => s.id === activeStore.id);
          if (fresh) setActiveStore(fresh);
        }
      } else {
        setActiveStore(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching stores:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [db, profile?.id]);

  // Load products of active store
  useEffect(() => {
    if (!db || !activeStore) {
      setProductsList([]);
      return;
    }

    const q = query(collection(db, 'products'), where('storeId', '==', activeStore.id));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProductsList(list);
    });

    return () => unsub();
  }, [db, activeStore?.id]);

  // Handle opening store modal
  const handleOpenStoreModal = (storeObj?: StoreType) => {
    if (storeObj) {
      setEditingStore(storeObj);
      setStoreName(storeObj.name);
      setStoreUsername(storeObj.username);
      setStoreLogo(storeObj.logo);
      setStoreCover(storeObj.cover);
      setStoreDesc(storeObj.description);
      setStoreCategory(storeObj.category);
      setStoreContact(storeObj.contactInfo);
      setStoreLocation(storeObj.location || '');
      setStoreWebsite(storeObj.websiteUrl || '');
      setStoreFb(storeObj.facebookUrl || '');
      setStoreInsta(storeObj.instagramUrl || '');
      setStoreWa(storeObj.whatsappUrl || '');
      setStoreTelegram(storeObj.telegramUrl || '');
      setStoreYt(storeObj.youtubeUrl || '');
    } else {
      setEditingStore(null);
      setStoreName('');
      setStoreUsername('');
      setStoreLogo('');
      setStoreCover('');
      setStoreDesc('');
      setStoreCategory(MARKETPLACE_CATEGORIES[0].id);
      setStoreContact('');
      setStoreLocation('');
      setStoreWebsite('');
      setStoreFb('');
      setStoreInsta('');
      setStoreWa('');
      setStoreTelegram('');
      setStoreYt('');
    }
    setShowStoreModal(true);
  };

  // Submit store creation/edit
  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !db) return;
    if (!storeName.trim() || !storeUsername.trim()) {
      addToast({ title: 'REQUIRED FIELDS', message: 'Name and @username must be defined.', type: 'warning' });
      return;
    }

    const sanitizedUsername = storeUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');

    const storePayload = {
      name: storeName.trim(),
      username: sanitizedUsername,
      logo: storeLogo,
      cover: storeCover,
      description: storeDesc.trim(),
      category: storeCategory,
      contactInfo: storeContact.trim(),
      location: storeLocation.trim(),
      websiteUrl: storeWebsite.trim(),
      facebookUrl: storeFb.trim(),
      instagramUrl: storeInsta.trim(),
      whatsappUrl: storeWa.trim(),
      telegramUrl: storeTelegram.trim(),
      youtubeUrl: storeYt.trim(),
      updatedAt: serverTimestamp()
    };

    try {
      if (editingStore) {
        await updateDoc(doc(db, 'stores', editingStore.id), storePayload);
        addToast({ title: 'STORE UPDATED', message: `${storeName} settings updated successfully!`, type: 'success' });
      } else {
        const fullPayload = {
          ...storePayload,
          ownerId: profile.id,
          followers: [],
          productsCount: 0,
          avgRating: 5.0,
          totalReviews: 0,
          createdAt: serverTimestamp()
        };
        const ref = await addDoc(collection(db, 'stores'), fullPayload);
        earnPoints(50); // reward points for store creation
        addToast({ title: 'BUSINESS LAUNCHED', message: `Congratulations! ${storeName} is officially online! +50 Points earned`, type: 'success' });
      }
      setShowStoreModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const StoreSkeleton = () => (
    <div className="flex flex-row md:flex-wrap gap-2.5 md:gap-4 pt-3 overflow-x-auto no-scrollbar scroll-smooth">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-2 md:p-3.5 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3.5 border border-white/5 bg-zinc-900/20 h-14 md:h-16 min-w-[155px] md:min-w-[200px] flex-nowrap shrink-0 md:flex-1 md:max-w-sm animate-pulse">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-white/5 shrink-0" />
          <div className="flex-1 min-w-0 pr-1 space-y-2">
            <div className="h-2.5 bg-white/10 rounded w-2/3" />
            <div className="h-2 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  const ProductSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pt-2">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden flex flex-col animate-pulse">
          <div className="aspect-video bg-white/5" />
          <div className="p-4 space-y-3">
            <div className="h-3 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/4" />
            <div className="flex gap-2 pt-2">
              <div className="h-8 bg-white/5 rounded-lg flex-1" />
              <div className="h-8 bg-white/5 rounded-lg w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Handle Logo & Cover photo uploads
  const handleUploadPhoto = async (file: File, type: 'logo' | 'cover') => {
    if (!file) return;
    setUploadingState(type);
    try {
      const url = await uploadMedia(file, 'stores_assets');
      if (type === 'logo') setStoreLogo(url);
      else setStoreCover(url);
      addToast({ title: 'UPLOAD SUCCESSFUL', message: `${type.toUpperCase()} logo asset updated!`, type: 'success' });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingState('');
    }
  };

  // Switch Stores easily
  const handleSwitchStore = (storeObj: StoreType) => {
    setActiveStore(storeObj);
    setSubTab('products');
  };

  // Handle opening product modal (CRUD)
  const handleOpenProductModal = (prodObj?: Product) => {
    if (prodObj) {
      setEditingProduct(prodObj);
      setProdName(prodObj.name);
      setProdDesc(prodObj.description);
      setProdPrice(prodObj.price.toString());
      setProdDiscount(prodObj.discountPrice?.toString() || '');
      setProdCategory(prodObj.category);
      setProdStock(prodObj.stockStatus);
      setProdVariants(prodObj.variants?.join(', ') || '');
      setProdTags(prodObj.tags?.join(', ') || '');
      setTempMediaItems(prodObj.mediaItems || []);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdDesc('');
      setProdPrice('');
      setProdDiscount('');
      setProdCategory(MARKETPLACE_CATEGORIES[0].id);
      setProdStock('available');
      setProdVariants('');
      setProdTags('');
      setTempMediaItems([]);
    }
    setShowProductModal(true);
  };

  // Add Product to Store
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !activeStore) return;
    if (!prodName.trim() || !prodPrice) {
      addToast({ title: 'REQUIRED FIELDS', message: 'Name and pricing required.', type: 'warning' });
      return;
    }

    const variantsArr = prodVariants ? prodVariants.split(',').map(s => s.trim()).filter(Boolean) : [];
    const tagsArr = prodTags ? prodTags.split(',').map(s => s.trim()).filter(Boolean) : [];

    const productPayload = {
      storeId: activeStore.id,
      storeName: activeStore.name,
      storeLogo: activeStore.logo,
      name: prodName.trim(),
      description: prodDesc.trim(),
      price: parseFloat(prodPrice),
      discountPrice: prodDiscount ? parseFloat(prodDiscount) : null,
      category: prodCategory,
      stockStatus: prodStock,
      variants: variantsArr,
      tags: tagsArr,
      mediaItems: tempMediaItems,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productPayload);
        addToast({ title: 'PRODUCT MODIFIED', message: `${prodName} was updated instantly!`, type: 'success' });
      } else {
        const fullPayload = {
          ...productPayload,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'products'), fullPayload);
        await updateDoc(doc(db, 'stores', activeStore.id), {
          productsCount: (activeStore.productsCount || 0) + 1
        });
        earnPoints(20);
        addToast({ title: 'PRODUCT ADDED', message: `Your iPhone style product ${prodName} was listed. +20 Points!`, type: 'success' });
      }
      setShowProductModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Product media list ordering & uploads
  const handleProductAddMedia = async (file: File, type: 'image' | 'video') => {
    if (!file) return;
    setUploadingState('product_media');
    try {
      const url = await uploadMedia(file, 'products_media');
      const newItem: ProductMediaItem = {
        id: 'm_' + Date.now(),
        type,
        url
      };
      setTempMediaItems(prev => [...prev, newItem]);
      addToast({ title: 'MEDIA STAGED', message: `Media item queued for insertion.`, type: 'success' });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingState('');
    }
  };

  const handleRemoveProductMedia = (id: string) => {
    setTempMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const handleReorderMedia = (index: number, direction: 'left' | 'right') => {
    const list = [...tempMediaItems];
    if (direction === 'left' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'right' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setTempMediaItems(list);
  };

  // Delete product completely
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!db || !activeStore) return;
    if (!confirm(`Are you sure you want to remove ${name}? This is irreversible.`)) return;

    try {
      await deleteDoc(doc(db, 'products', id));
      await updateDoc(doc(db, 'stores', activeStore.id), {
        productsCount: Math.max(0, (activeStore.productsCount || 0) - 1)
      });
      addToast({ title: 'PRODUCT ARCHIVED', message: `${name} has been removed from catalogue.`, type: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  // Composing a Store Post (Announcements, Flash Sales)
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !activeStore || !postContent.trim()) return;

    setIsPublishingPost(true);
    try {
      await addDoc(collection(db, 'store_posts'), {
        storeId: activeStore.id,
        storeName: activeStore.name,
        storeLogo: activeStore.logo,
        content: postContent.trim(),
        mediaUrl: postMedia,
        mediaType: postMediaType,
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        createdAt: serverTimestamp()
      });

      setPostContent('');
      setPostMedia('');
      addToast({ title: 'POST PUBLISHED', message: 'Annouuncement added to your business profile & follower flows!', type: 'success' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishingPost(false);
    }
  };

  // Handle Store Post Image Upload
  const handlePostMediaUpload = async (file: File, type: 'image' | 'video') => {
    if (!file) return;
    setUploadingState('post_media');
    try {
      const url = await uploadMedia(file, 'store_posts');
      setPostMedia(url);
      setPostMediaType(type);
      addToast({ title: 'MEDIA STAGED', message: 'Post visual staged successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingState('');
    }
  };

  return (
    <div className="space-y-3.5 md:space-y-6">
      {/* Upper Panel: Stores switcher */}
      <div className="rounded-2xl md:rounded-3xl border border-white/5 bg-zinc-950/80 p-3 md:p-5 scroll-smooth shadow-inner">
        <div className="flex flex-row items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <h2 className="text-xs md:text-base font-black text-white flex items-center gap-1.5 font-mono">
              <Store size={14} className="md:size-[18px] text-indigo-400" />
              MY SHOPS
            </h2>
            <p className="text-[10px] md:text-xs text-neutral-400 mt-0.5 hidden sm:block">Manage multiple storefronts under single control panel</p>
          </div>
          <button
            onClick={() => handleOpenStoreModal()}
            className="cursor-pointer px-2.5 py-1.5 md:px-4 md:py-2 bg-white hover:bg-neutral-100 text-black text-[9px] md:text-xs font-black uppercase rounded-lg flex items-center justify-center gap-1 font-mono transition-all active:scale-95 shadow shrink-0"
          >
            <Plus size={12} /> <span className="hidden xs:inline">New Store</span><span className="xs:hidden">New</span>
          </button>
        </div>

        {/* List of multiple stores owned */}
        {loading ? (
          <StoreSkeleton />
        ) : myStores.length === 0 ? (
          <div className="py-8 md:py-12 p-4 text-center text-neutral-500 max-w-md mx-auto space-y-4">
            <Store className="mx-auto mb-2 opacity-15 text-indigo-500/20" size={36} />
            <p className="text-xs font-mono text-neutral-450">No active business registrees found under your credentials.</p>
            <button
              onClick={() => handleOpenStoreModal()}
              className="cursor-pointer mx-auto px-4 py-2 text-xs bg-zinc-800 text-white font-black uppercase rounded-lg border border-white/10 hover:bg-zinc-700 transition"
            >
              Get Started Now
            </button>
          </div>
        ) : (
          <div className="flex flex-row md:flex-wrap gap-2.5 md:gap-4 pt-3 overflow-x-auto no-scrollbar scroll-smooth">
            {myStores.map(st => {
              const isActive = activeStore?.id === st.id;
              return (
                <div
                  key={st.id}
                  onClick={() => handleSwitchStore(st)}
                  className={`cursor-pointer p-2 md:p-3.5 rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3.5 border transition-all h-14 md:h-16 min-w-[155px] md:min-w-[200px] flex-nowrap shrink-0 md:flex-1 md:max-w-sm ${
                    isActive 
                      ? 'bg-zinc-900 border-indigo-500 text-white shadow-lg shadow-indigo-500/15' 
                      : 'bg-zinc-900/40 border-white/5 text-neutral-400 hover:border-white/10 hover:text-white'
                  }`}
                >
                  <img src={getAvatarUrl(st.logo)} className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl object-cover border border-white/5 bg-neutral-900 shrink-0" alt="" />
                  <div className="flex-1 min-w-0 pr-1 select-none">
                    <p className="text-[11px] md:text-xs font-extrabold truncate">{st.name}</p>
                    <p className="text-[8px] md:text-[9.5px] font-mono text-neutral-500 truncate">@{st.username}</p>
                  </div>
                  {isActive && <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Store Hub */}
      {activeStore && (
        <div className="rounded-2xl md:rounded-3xl border border-white/5 bg-zinc-950/40 overflow-hidden flex flex-col md:flex-row min-h-[400px] md:min-h-[500px]">
          
          {/* DESKTOP Sub Navigation (Hidden on Mobile) */}
          <div className="hidden md:flex w-56 border-r border-white/5 flex-col pt-3 bg-zinc-950 shrink-0">
            {/* Header info */}
            <div className="px-5 py-3 border-b border-white/[0.03] pb-4 select-none">
              <div className="flex items-center gap-2.5">
                <img src={getAvatarUrl(activeStore.logo)} className="h-8 w-8 rounded-lg object-cover" alt="" />
                <div className="min-w-0">
                  <p className="text-xs font-black hover:text-indigo-300 transition truncate">{activeStore.name}</p>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase font-mono bg-white/5 py-0.5 px-1.5 rounded">{activeStore.category}</span>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="flex-1 p-2.5 space-y-1">
              <button
                onClick={() => setSubTab('products')}
                className={`w-full text-left cursor-pointer py-3.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  subTab === 'products' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ShoppingBag size={14} /> Catalog Manage
              </button>
              <button
                onClick={() => setSubTab('posts')}
                className={`w-full text-left cursor-pointer py-3.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  subTab === 'posts' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Megaphone size={14} /> Shop Updates
              </button>
              <button
                onClick={() => setSubTab('inbox')}
                className={`w-full text-left cursor-pointer py-3.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  subTab === 'inbox' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <MessageSquare size={14} /> Store Inbox
              </button>
              <button
                onClick={() => setSubTab('setup')}
                className={`w-full text-left cursor-pointer py-3.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  subTab === 'setup' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Settings size={14} /> Store Profile
              </button>
            </div>

            {/* Quick launch store page */}
            <div className="p-3 mt-auto border-t border-white/[0.03]">
              <button
                onClick={() => onViewStore(activeStore)}
                className="cursor-pointer w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
              >
                <Eye size={12} /> View Page
              </button>
            </div>
          </div>

          {/* MOBILE Sub Navigation Bar & Compact Header (Hidden on Desktop) */}
          <div className="flex md:hidden flex-col bg-[#050505] border-b border-white/5 shrink-0 sticky top-0 z-10">
            {/* Top Compact info row */}
            <div className="flex items-center justify-between p-3 border-b border-white/[0.03] bg-zinc-950/90">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <img src={getAvatarUrl(activeStore.logo)} className="h-7 w-7 rounded-md object-cover border border-white/10 shrink-0" alt="" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-white truncate">{activeStore.name}</p>
                  <p className="text-[8px] font-mono font-bold text-indigo-400 uppercase tracking-widest">{activeStore.category}</p>
                </div>
              </div>
              <button
                onClick={() => onViewStore(activeStore)}
                className="cursor-pointer px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-white/[0.85] font-extrabold text-[10px] flex items-center gap-1 transition shrink-0 active:scale-95"
              >
                <Eye size={10} /> View Page
              </button>
            </div>

            {/* Flat icon segment grid with tab controls */}
            <div className="grid grid-cols-4 gap-0.5 p-1 bg-zinc-950">
              <button
                onClick={() => setSubTab('products')}
                className={`py-2 px-1 rounded-lg text-center flex flex-col items-center justify-center transition-all ${
                  subTab === 'products' ? 'bg-zinc-900 border border-white/5 text-white shadow-inner' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <ShoppingBag size={14} className={subTab === 'products' ? "text-indigo-400" : ""} />
                <span className="text-[8.5px] font-black uppercase tracking-wider mt-1">Catalog</span>
              </button>
              <button
                onClick={() => setSubTab('posts')}
                className={`py-2 px-1 rounded-lg text-center flex flex-col items-center justify-center transition-all ${
                  subTab === 'posts' ? 'bg-zinc-900 border border-white/5 text-white shadow-inner' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Megaphone size={14} className={subTab === 'posts' ? "text-indigo-400" : ""} />
                <span className="text-[8.5px] font-black uppercase tracking-wider mt-1">Updates</span>
              </button>
              <button
                onClick={() => setSubTab('inbox')}
                className={`py-2 px-1 rounded-lg text-center flex flex-col items-center justify-center transition-all ${
                  subTab === 'inbox' ? 'bg-zinc-900 border border-white/5 text-white shadow-inner' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <MessageSquare size={14} className={subTab === 'inbox' ? "text-indigo-400" : ""} />
                <span className="text-[8.5px] font-black uppercase tracking-wider mt-1">Inbox</span>
              </button>
              <button
                onClick={() => setSubTab('setup')}
                className={`py-2 px-1 rounded-lg text-center flex flex-col items-center justify-center transition-all ${
                  subTab === 'setup' ? 'bg-zinc-900 border border-white/5 text-white shadow-inner' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Settings size={14} className={subTab === 'setup' ? "text-indigo-400" : ""} />
                <span className="text-[8.5px] font-black uppercase tracking-wider mt-1">Profile</span>
              </button>
            </div>
          </div>

          {/* Sub Tab Panel */}
          <div className="flex-1 p-3 md:p-6 relative bg-zinc-950/20">
            <AnimatePresence mode="wait">
              {/* CATALOG MANAGER */}
              {subTab === 'products' && (
                <motion.div
                  key="catalog"
                  initial={{ opacity: 0, x: 2 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Products Catalog</h3>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{productsList.length} total listed items</p>
                    </div>
                    <button
                      onClick={() => handleOpenProductModal()}
                      className="cursor-pointer px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white text-[10px] font-black uppercase rounded-lg border border-white/10 flex items-center gap-1 font-mono tracking-widest transition"
                    >
                      <Plus size={12} /> Add Product
                    </button>
                  </div>

                  {productsList.length === 0 ? (
                    loading ? (
                      <ProductSkeleton />
                    ) : (
                      <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-2xl opacity-20">
                        <ShoppingBag className="mx-auto mb-2" size={32} />
                        <p className="text-xs font-mono">No products staged yet.</p>
                      </div>
                    )
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pt-2">
                      {productsList.map(prod => {
                        const hasDiscount = prod.discountPrice && prod.discountPrice < prod.price;
                        return (
                          <div 
                            key={prod.id}
                            className="bg-zinc-900/60 rounded-2xl border border-white/5 overflow-hidden flex flex-col group"
                          >
                            <div className="aspect-video bg-neutral-900 relative">
                              {prod.mediaItems && prod.mediaItems.length > 0 ? (
                                prod.mediaItems[0].type === 'video' ? (
                                  <video src={prod.mediaItems[0].url} className="w-full h-full object-cover" muted />
                                ) : (
                                  <img src={prod.mediaItems[0].url} className="w-full h-full object-cover" alt="" />
                                )
                              ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-10">
                                  <ShoppingBag size={24} />
                                </div>
                              )}

                              {prod.stockStatus === 'out_of_stock' && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-[10px] font-bold text-orange-400 tracking-wider">
                                  SKU OUT OF STOCK
                                </div>
                              )}
                            </div>

                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                  {hasDiscount ? (
                                    <>
                                      <span className="text-xs font-black text-white">৳{prod.discountPrice?.toLocaleString()}</span>
                                      <span className="text-[10px] text-neutral-500 line-through">৳{prod.price.toLocaleString()}</span>
                                    </>
                                  ) : (
                                    <span className="text-xs font-black text-white">৳{prod.price.toLocaleString()}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.03]">
                                <button
                                  type="button"
                                  onClick={() => handleOpenProductModal(prod)}
                                  className="cursor-pointer flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase transition"
                                >
                                  Modify
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                  className="cursor-pointer py-1.5 px-2 bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* POSTS COMPOSER */}
              {subTab === 'posts' && (
                <motion.div
                  key="posts"
                  initial={{ opacity: 0, x: 2 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -2 }}
                  className="max-w-xl mx-auto space-y-6"
                >
                  <div>
                    <h3 className="text-sm font-bold text-white">Shop Updates</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Share announcements, flash sales, and new arrivals with your followers.</p>
                  </div>

                  <form onSubmit={handlePublishPost} className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-mono text-neutral-450 font-black block mb-2">Announcement Message</label>
                      <textarea
                        value={postContent}
                        onChange={e => setPostContent(e.target.value)}
                        placeholder="Type Weekend Offer, Flash Sale, or Announcements..."
                        rows={4}
                        className="w-full text-xs text-white placeholder:text-neutral-600 bg-neutral-900 border border-white/5 rounded-2xl p-4 focus:outline-none focus:border-white transition-all resize-none select-text leading-relaxed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-mono text-neutral-450 font-black block">Post Media</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          id="post-media-file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const isVideo = file.type.startsWith('video/');
                              handlePostMediaUpload(file, isVideo ? 'video' : 'image');
                            }
                          }}
                        />
                        <label 
                          htmlFor="post-media-file"
                          className="cursor-pointer py-2 px-4 rounded-xl border border-white/5 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition active:scale-95 shrink-0"
                        >
                          <ImageIcon size={14} /> Upload Media
                        </label>
                        {uploadingState === 'post_media' && (
                          <span className="text-[10px] text-zinc-400 font-mono animate-pulse">Uploading...</span>
                        )}
                      </div>

                      {postMedia && (
                        <div className="mt-3 relative rounded-xl overflow-hidden border border-white/5 h-24 w-40">
                          {postMediaType === 'video' ? (
                            <video src={postMedia} className="w-full h-full object-cover" />
                          ) : (
                            <img src={postMedia} className="w-full h-full object-cover" alt="" />
                          )}
                          <button
                            type="button"
                            onClick={() => setPostMedia('')}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-neutral-400 hover:text-white"
                          >
                            &times;
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isPublishingPost || !postContent.trim()}
                      className="cursor-pointer w-full py-3 bg-white text-black text-xs font-mono font-black uppercase rounded-xl hover:bg-neutral-100 transition disabled:opacity-30"
                    >
                      {isPublishingPost ? 'Sharing...' : 'Share Update'}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* INTEGRATED MESSAGING MODULE */}
              {subTab === 'inbox' && (
                <motion.div
                  key="inbox"
                  initial={{ opacity: 0, x: 2 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -2 }}
                  className="h-[550px] overflow-hidden rounded-2xl border border-white/5"
                >
                  <MarketplaceBusinessInbox />
                </motion.div>
              )}

              {/* STORE DETAILED PROFILE AND METADATA */}
              {subTab === 'setup' && (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0, x: 2 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -2 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                    <div>
                      <h3 className="text-sm font-bold text-white">Merchant Config</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">Control visual covers, category indices, and external links</p>
                    </div>
                  </div>

                  <form onSubmit={handleStoreSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1.5">Store Public Name</label>
                        <input
                          type="text"
                          value={storeName}
                          onChange={e => setStoreName(e.target.value)}
                          className="w-full text-xs text-white bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-white select-text"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1.5">Store Username (@handle)</label>
                        <input
                          type="text"
                          value={storeUsername}
                          onChange={e => setStoreUsername(e.target.value)}
                          className="w-full text-xs text-white bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-white select-text"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1.5">Logo Image Asset</label>
                        <input
                          type="file"
                          id="store-logo-file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadPhoto(file, 'logo');
                          }}
                        />
                        <div className="flex items-center gap-3">
                          <label 
                            htmlFor="store-logo-file"
                            className="cursor-pointer py-2 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-bold rounded-lg border border-white/5 transition active:scale-95"
                          >
                            Select Image
                          </label>
                          {storeLogo && <img src={storeLogo} className="h-8 w-8 object-cover rounded-lg border border-white/5 bg-neutral-900" alt="" />}
                          {uploadingState === 'logo' && <span className="text-[10px] text-zinc-500 animate-pulse">Uploading...</span>}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1.5">Cover Billboard Banner</label>
                        <input
                          type="file"
                          id="store-cover-file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadPhoto(file, 'cover');
                          }}
                        />
                        <div className="flex items-center gap-3">
                          <label 
                            htmlFor="store-cover-file"
                            className="cursor-pointer py-2 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-bold rounded-lg border border-white/5 transition active:scale-95"
                          >
                            Select Image
                          </label>
                          {storeCover && <img src={storeCover} className="h-8 w-12 object-cover rounded-lg border border-white/5 bg-neutral-900" alt="" />}
                          {uploadingState === 'cover' && <span className="text-[10px] text-zinc-500 animate-pulse">Uploading...</span>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1.5">Description (Public Bio)</label>
                      <textarea
                        value={storeDesc}
                        onChange={e => setStoreDesc(e.target.value)}
                        rows={3}
                        className="w-full text-xs text-white bg-neutral-900 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-white select-text resize-none leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1.5">Store Category</label>
                        <select
                          value={storeCategory}
                          onChange={e => setStoreCategory(e.target.value)}
                          className="w-full text-xs text-white bg-neutral-900 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-white cursor-pointer"
                        >
                          {MARKETPLACE_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id} className="bg-zinc-950 text-neutral-300">{cat.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1.5">Contact Information</label>
                        <input
                          type="text"
                          value={storeContact}
                          onChange={e => setStoreContact(e.target.value)}
                          placeholder="Email, WhatsApp, Phone..."
                          className="w-full text-xs text-white bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-white select-text"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1.5">Physial Location (Optional)</label>
                        <input
                          type="text"
                          value={storeLocation}
                          onChange={e => setStoreLocation(e.target.value)}
                          placeholder="e.g. Mirpur-10, Dhaka"
                          className="w-full text-xs text-white bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-white select-text"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1.5">Official Website URL</label>
                        <input
                          type="text"
                          value={storeWebsite}
                          onChange={e => setStoreWebsite(e.target.value)}
                          placeholder="https://jimelectronics.com"
                          className="w-full text-xs text-white bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-white select-text"
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/[0.03] pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[9px] uppercase font-mono text-zinc-500 block mb-1">Facebook URL</label>
                        <input type="text" value={storeFb} onChange={e => setStoreFb(e.target.value)} className="w-full text-xs text-zinc-300 bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-mono text-zinc-500 block mb-1">Instagram URL</label>
                        <input type="text" value={storeInsta} onChange={e => setStoreInsta(e.target.value)} className="w-full text-xs text-zinc-300 bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-mono text-zinc-500 block mb-1">WhatsApp Mobile link</label>
                        <input type="text" value={storeWa} onChange={e => setStoreWa(e.target.value)} className="w-full text-xs text-zinc-300 bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none" placeholder="https://wa.me/..." />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-mono text-zinc-500 block mb-1">Telegram username link</label>
                        <input type="text" value={storeTelegram} onChange={e => setStoreTelegram(e.target.value)} className="w-full text-xs text-zinc-300 bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none" placeholder="https://t.me/..." />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-mono text-zinc-500 block mb-1">YouTube URL</label>
                        <input type="text" value={storeYt} onChange={e => setStoreYt(e.target.value)} className="w-full text-xs text-zinc-300 bg-neutral-900 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="cursor-pointer w-full py-3 bg-indigo-500 text-white font-mono font-black uppercase text-xs rounded-xl hover:bg-indigo-400 transition"
                    >
                      Save Configuration
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* CREATE / EDIT STORE MODAL */}
      <AnimatePresence>
        {showStoreModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl p-6 max-h-[90vh] overflow-y-auto max-w-xl w-full"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                <h3 className="text-sm font-black text-white font-mono uppercase">
                  {editingStore ? 'Edit Store Properties' : 'Initialize Business Store'}
                </h3>
                <button onClick={() => setShowStoreModal(false)} className="text-zinc-550 hover:text-white p-1">
                  &times;
                </button>
              </div>

              <form onSubmit={handleStoreSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  <div>
                    <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Store Name</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      placeholder="e.g. Jim Electronics"
                      className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-white select-text"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Store Username (@)</label>
                    <input
                      type="text"
                      value={storeUsername}
                      onChange={e => setStoreUsername(e.target.value)}
                      placeholder="e.g. jimelectronics"
                      className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-white select-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Store Bio Description</label>
                  <textarea
                    value={storeDesc}
                    onChange={e => setStoreDesc(e.target.value)}
                    placeholder="We sell premium verified electronics..."
                    rows={3}
                    className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl p-3 focus:outline-none resize-none leading-relaxed select-text"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Category Sector</label>
                    <select
                      value={storeCategory}
                      onChange={e => setStoreCategory(e.target.value)}
                      className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                    >
                      {MARKETPLACE_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-zinc-950 text-neutral-300">{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Business Phone / Contact Info</label>
                    <input
                      type="text"
                      value={storeContact}
                      onChange={e => setStoreContact(e.target.value)}
                      placeholder="e.g. 01712-345678"
                      className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl px-3 py-2 focus:outline-none select-text"
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 flex gap-3 text-right">
                  <button
                    type="button"
                    onClick={() => setShowStoreModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-white/5 font-mono text-xs font-black uppercase transition shrink-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-mono text-xs font-black uppercase transition cursor-pointer"
                  >
                    {editingStore ? 'Update details' : 'Deploy Business'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT PRODUCT MODAL (WITH DISCOUNTS AND MEDIA REORDER MANAGER) */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl p-6 max-h-[90vh] overflow-y-auto max-w-xl w-full"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
                <h3 className="text-sm font-black text-white font-mono uppercase">
                  {editingProduct ? 'Update Product Listing' : 'Staged Product Entry'}
                </h3>
                <button onClick={() => setShowProductModal(false)} className="text-zinc-550 hover:text-white p-1">
                  &times;
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <MarketplaceWritingHelper
                  prodName={prodName}
                  prodDesc={prodDesc}
                  prodPrice={prodPrice}
                  category={prodCategory}
                  onApplyTitle={setProdName}
                  onApplyDesc={setProdDesc}
                  onApplyPrice={setProdPrice}
                />

                <div>
                  <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Product Title</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={e => setProdName(e.target.value)}
                    placeholder="e.g. iPhone 15 Pro Max"
                    className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl px-3 py-2.5 focus:outline-none select-text"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Description</label>
                  <textarea
                    value={prodDesc}
                    onChange={e => setProdDesc(e.target.value)}
                    placeholder="Provide details about specs, condition, variants..."
                    rows={3}
                    className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl p-3 focus:outline-none resize-none leading-relaxed select-text"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Standard Price (৳)</label>
                    <input
                      type="number"
                      value={prodPrice}
                      onChange={e => setProdPrice(e.target.value)}
                      placeholder="e.g. 135000"
                      className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl px-3 py-2 focus:outline-none select-text"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Discount Price (৳, Optional)</label>
                    <input
                      type="number"
                      value={prodDiscount}
                      onChange={e => setProdDiscount(e.target.value)}
                      placeholder="e.g. 125000"
                      className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl px-3 py-2 focus:outline-none select-text"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Category</label>
                    <select
                      value={prodCategory}
                      onChange={e => setProdCategory(e.target.value)}
                      className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                    >
                      {MARKETPLACE_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-zinc-950 text-neutral-300">{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Stock Status</label>
                    <select
                      value={prodStock}
                      onChange={e => setProdStock(e.target.value as any)}
                      className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                    >
                      <option value="available" className="bg-zinc-950 text-neutral-300">Available</option>
                      <option value="out_of_stock" className="bg-zinc-950 text-neutral-300">Out of Stock</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Variants (comma separated)</label>
                    <input
                      type="text"
                      value={prodVariants}
                      onChange={e => setProdVariants(e.target.value)}
                      placeholder="e.g. 128GB, 256GB"
                      className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl px-3 py-2 focus:outline-none select-text"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-mono text-neutral-400 block mb-1">Search tags (comma separated)</label>
                    <input
                      type="text"
                      value={prodTags}
                      onChange={e => setProdTags(e.target.value)}
                      placeholder="e.g. apple, iphone, phone"
                      className="w-full text-xs text-white bg-neutral-900 border border-white/5 rounded-xl px-3 py-2 focus:outline-none select-text"
                    />
                  </div>
                </div>

                {/* MEDIA MANAGER WITH INDEX REORDER & DELETE ACTIONS */}
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <label className="text-[10px] uppercase font-mono text-zinc-400 font-extrabold block">Product Media Slider</label>
                  
                  <div className="flex flex-wrap gap-2.5">
                    {tempMediaItems.map((item, index) => (
                      <div key={item.id} className="relative h-16 w-24 bg-neutral-900 rounded-xl overflow-hidden border border-white/5 group/thumb shrink-0">
                        {item.type === 'video' ? (
                          <video src={item.url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={item.url} className="w-full h-full object-cover" alt="" />
                        )}

                        {/* Top corner Delete */}
                        <button
                          type="button"
                          onClick={() => handleRemoveProductMedia(item.id)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition"
                        >
                          <Trash2 size={10} />
                        </button>

                        {/* Reorder strip */}
                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-black/60 flex items-center justify-center gap-1.5 opacity-0 group-hover\/thumb:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleReorderMedia(index, 'left')}
                            disabled={index === 0}
                            className="text-white disabled:opacity-20 hover:scale-115 cursor-pointer"
                          >
                            <MoveLeft size={10} />
                          </button>
                          <span className="text-[8px] text-zinc-400 font-mono select-none">{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleReorderMedia(index, 'right')}
                            disabled={index === tempMediaItems.length - 1}
                            className="text-white disabled:opacity-20 hover:scale-115 cursor-pointer"
                          >
                            <MoveRight size={10} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Drag-and-drop or manual media adder file input handles */}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        id="p-media-photo"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProductAddMedia(file, 'image');
                        }}
                      />
                      <label 
                        htmlFor="p-media-photo"
                        className="cursor-pointer h-16 w-16 rounded-xl border border-dashed border-white/10 hover:border-white/20 bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 hover:text-white transition shrink-0"
                      >
                        <ImageIcon size={16} />
                        <span className="text-[8px] font-mono mt-1">Photo</span>
                      </label>

                      <input
                        type="file"
                        id="p-media-video"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProductAddMedia(file, 'video');
                        }}
                      />
                      <label 
                        htmlFor="p-media-video"
                        className="cursor-pointer h-16 w-16 rounded-xl border border-dashed border-white/10 hover:border-white/20 bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 hover:text-white transition shrink-0"
                      >
                        <VideoIcon size={16} />
                        <span className="text-[8px] font-mono mt-1">Video</span>
                      </label>
                    </div>
                  </div>

                  {uploadingState === 'product_media' && (
                    <span className="text-[9px] text-zinc-400 font-mono animate-pulse block">Uploading file to cloud staging directory...</span>
                  )}
                </div>

                <div className="border-t border-white/5 pt-4 flex gap-3 text-right">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white border border-white/5 font-mono text-xs font-black uppercase transition shrink-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-mono text-xs font-black uppercase transition cursor-pointer"
                  >
                    {editingProduct ? 'Save changes' : 'Upload SKU'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
