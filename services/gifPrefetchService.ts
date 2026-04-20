import { Platform } from 'react-native';
import { Image } from 'react-native';

export type TabType = 'planner' | 'stops' | 'routes' | 'hubs';

export const TAB_URLS: Record<TabType, string> = {
    planner: 'https://uthutho.co.za/images/planner.gif',
    stops: 'https://uthutho.co.za/images/stop.gif',
    routes: 'https://uthutho.co.za/images/route.gif',
    hubs: 'https://uthutho.co.za/images/hub.gif',
};

class GifPrefetchService {
    private cachedURIs: Record<TabType, string | null> = {
        planner: null,
        stops: null,
        routes: null,
        hubs: null,
    };

    private prefetchPromise: Promise<void> | null = null;

    // Start prefetching immediately when app loads
    startPrefetching() {
        if (this.prefetchPromise) return this.prefetchPromise;

        this.prefetchPromise = this.prefetchAllGifs();
        return this.prefetchPromise;
    }

    private async prefetchAllGifs() {
        if (Platform.OS === 'web') {
            // On web, use Image.prefetch (browser-native caching)
            await this.prefetchForWeb();
        } else {
            // On native, use expo-file-system for disk caching
            await this.prefetchForNative();
        }
    }

    private async prefetchForWeb() {
        const prefetchPromises = Object.entries(TAB_URLS).map(async ([tab, url]) => {
            const tabKey = tab as TabType;
            try {
                await Image.prefetch(url);
                this.cachedURIs[tabKey] = url;
            } catch (error) {
                console.error(`Failed to prefetch ${tabKey}:`, error);
                // Still set the URL so the image can attempt to load directly
                this.cachedURIs[tabKey] = url;
            }
        });

        await Promise.all(prefetchPromises);
    }

    private async prefetchForNative() {
        // Dynamically import expo-file-system only on native
        const FileSystem = await import('expo-file-system');
        const cacheDir = `${FileSystem.cacheDirectory}gifs/`;

        // Create cache directory
        const dirInfo = await FileSystem.getInfoAsync(cacheDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        }

        // Download all GIFs in parallel
        const downloadPromises = Object.entries(TAB_URLS).map(async ([tab, url]) => {
            const tabKey = tab as TabType;
            const filename = `${tabKey}.gif`;
            const cachedPath = `${cacheDir}${filename}`;

            try {
                // Check if already cached
                const cachedFile = await FileSystem.getInfoAsync(cachedPath);

                if (cachedFile.exists) {
                    this.cachedURIs[tabKey] = cachedPath;
                } else {
                    // Download and cache
                    const download = FileSystem.createDownloadResumable(url, cachedPath);
                    const result = await download.downloadAsync();
                    if (result) {
                        this.cachedURIs[tabKey] = result.uri;
                    }
                }
            } catch (error) {
                console.error(`Failed to cache ${tabKey}:`, error);
                // Fallback to direct URL
                this.cachedURIs[tabKey] = TAB_URLS[tabKey];
            }
        });

        await Promise.all(downloadPromises);
    }

    getCachedURI(tab: TabType): string | null {
        return this.cachedURIs[tab];
    }

    isReady(): boolean {
        return Object.values(this.cachedURIs).every(uri => uri !== null);
    }
}

export const gifPrefetchService = new GifPrefetchService();