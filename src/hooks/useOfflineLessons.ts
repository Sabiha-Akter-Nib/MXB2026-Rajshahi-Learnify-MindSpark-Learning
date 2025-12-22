import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OfflineLesson {
  id: string;
  title: string;
  title_bn: string | null;
  subject_id: string | null;
  chapter_number: number;
  bloom_level: string;
  content: unknown;
}

interface OfflineLessonPack {
  subjectId: string;
  subjectName: string;
  lessons: OfflineLesson[];
  downloadedAt: Date;
  sizeBytes: number;
}

interface UseOfflineLessonsReturn {
  downloadedPacks: OfflineLessonPack[];
  isDownloading: boolean;
  downloadProgress: number;
  downloadPack: (subjectId: string, subjectName: string) => Promise<boolean>;
  removePack: (subjectId: string) => Promise<boolean>;
  getOfflineLesson: (lessonId: string) => OfflineLesson | null;
  isPackDownloaded: (subjectId: string) => boolean;
  getTotalOfflineSize: () => number;
}

const DB_NAME = "mindspark-offline";
const DB_VERSION = 1;
const STORE_NAME = "lesson-packs";

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "subjectId" });
        }
      };
    });
  }

  async savePack(pack: OfflineLessonPack): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(pack);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPack(subjectId: string): Promise<OfflineLessonPack | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(subjectId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPacks(): Promise<OfflineLessonPack[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removePack(subjectId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(subjectId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const storage = new OfflineStorage();

export const useOfflineLessons = (): UseOfflineLessonsReturn => {
  const [downloadedPacks, setDownloadedPacks] = useState<OfflineLessonPack[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Load downloaded packs on mount
  useEffect(() => {
    const loadPacks = async () => {
      try {
        const packs = await storage.getAllPacks();
        setDownloadedPacks(packs);
      } catch (error) {
        console.error("Failed to load offline packs:", error);
      }
    };
    loadPacks();
  }, []);

  const downloadPack = useCallback(async (subjectId: string, subjectName: string): Promise<boolean> => {
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Fetch all lessons for this subject
      const { data: lessons, error } = await supabase
        .from("offline_lessons")
        .select("*")
        .eq("subject_id", subjectId);

      if (error) throw error;

      setDownloadProgress(50);

      // Calculate approximate size
      const jsonString = JSON.stringify(lessons);
      const sizeBytes = new Blob([jsonString]).size;

      const pack: OfflineLessonPack = {
        subjectId,
        subjectName,
        lessons: lessons || [],
        downloadedAt: new Date(),
        sizeBytes,
      };

      // Save to IndexedDB
      await storage.savePack(pack);
      
      setDownloadProgress(100);

      // Update state
      setDownloadedPacks(prev => {
        const filtered = prev.filter(p => p.subjectId !== subjectId);
        return [...filtered, pack];
      });

      // Also cache in service worker
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const cache = await caches.open("mindspark-lessons-v1");
        await cache.put(
          `/api/offline-lessons/${subjectId}`,
          new Response(JSON.stringify(pack))
        );
      }

      return true;
    } catch (error) {
      console.error("Failed to download pack:", error);
      return false;
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }, []);

  const removePack = useCallback(async (subjectId: string): Promise<boolean> => {
    try {
      await storage.removePack(subjectId);
      setDownloadedPacks(prev => prev.filter(p => p.subjectId !== subjectId));

      // Remove from cache
      if ("serviceWorker" in navigator) {
        const cache = await caches.open("mindspark-lessons-v1");
        await cache.delete(`/api/offline-lessons/${subjectId}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to remove pack:", error);
      return false;
    }
  }, []);

  const getOfflineLesson = useCallback((lessonId: string): OfflineLesson | null => {
    for (const pack of downloadedPacks) {
      const lesson = pack.lessons.find(l => l.id === lessonId);
      if (lesson) return lesson;
    }
    return null;
  }, [downloadedPacks]);

  const isPackDownloaded = useCallback((subjectId: string): boolean => {
    return downloadedPacks.some(p => p.subjectId === subjectId);
  }, [downloadedPacks]);

  const getTotalOfflineSize = useCallback((): number => {
    return downloadedPacks.reduce((total, pack) => total + pack.sizeBytes, 0);
  }, [downloadedPacks]);

  return {
    downloadedPacks,
    isDownloading,
    downloadProgress,
    downloadPack,
    removePack,
    getOfflineLesson,
    isPackDownloaded,
    getTotalOfflineSize,
  };
};