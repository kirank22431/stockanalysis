'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface XTimelineEmbedProps {
  mode: 'list' | 'profile';
  url: string;
  height?: number;
}

// Global script loading state
let scriptLoading = false;
let scriptLoaded = false;

export default function XTimelineEmbed({ mode, url, height = 700 }: XTimelineEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const embedKeyRef = useRef<string>('');

  // Generate unique key for this embed instance
  useEffect(() => {
    embedKeyRef.current = `embed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Load script if not already loaded
  useEffect(() => {
    if (scriptLoaded) {
      setScriptReady(true);
      return;
    }

    if (scriptLoading) {
      // Script is loading, wait for it
      const checkInterval = setInterval(() => {
        if (scriptLoaded && (window as any).twttr) {
          setScriptReady(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Load script
    scriptLoading = true;
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    script.onload = () => {
      console.log('Twitter widgets script loaded');
      scriptLoaded = true;
      scriptLoading = false;
      
      // Wait for twttr to be available
      if ((window as any).twttr) {
        (window as any).twttr.ready(() => {
          console.log('Twitter widgets ready');
          setScriptReady(true);
        });
      } else {
        // Fallback: check periodically
        const checkTwttr = setInterval(() => {
          if ((window as any).twttr) {
            (window as any).twttr.ready(() => {
              console.log('Twitter widgets ready (delayed)');
              setScriptReady(true);
              clearInterval(checkTwttr);
            });
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkTwttr);
          if (!scriptReady) {
            setError('Twitter widgets failed to initialize. Please refresh the page.');
          }
        }, 5000);
      }
    };
    script.onerror = () => {
      console.error('Failed to load Twitter widgets script');
      scriptLoading = false;
      setError('Failed to load Twitter widgets script. Please check your internet connection.');
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount, it's shared
    };
  }, []);

  // Create embed when URL changes and script is ready
  useEffect(() => {
    if (!url || !scriptReady || !containerRef.current) return;

    const timer = setTimeout(() => {
      createEmbed();
    }, 200);

    return () => clearTimeout(timer);
  }, [url, scriptReady]);

  const createEmbed = () => {
    if (!containerRef.current || !url) return;

    try {
      const twttr = (window as any).twttr;
      if (!twttr || !twttr.widgets) {
        console.error('Twitter widgets not available');
        setError('Twitter widgets not available. Please refresh the page.');
        return;
      }

      // Clear previous content
      containerRef.current.innerHTML = '';

      // Create the timeline anchor element
      const timelineLink = document.createElement('a');
      timelineLink.className = 'twitter-timeline';
      timelineLink.href = url;
      timelineLink.setAttribute('data-height', height.toString());
      timelineLink.setAttribute('data-theme', 'light');
      timelineLink.setAttribute('data-chrome', 'noheader nofooter');
      timelineLink.setAttribute('data-dnt', 'true');
      timelineLink.textContent = 'Loading timeline...';
      
      containerRef.current.appendChild(timelineLink);

      setIsLoaded(false);
      setError(null);

      // Load the widget
      twttr.widgets.load(containerRef.current).then(() => {
        console.log('Timeline loaded successfully for:', url);
        setIsLoaded(true);
      }).catch((err: any) => {
        console.error('Error loading Twitter timeline:', err);
        setError(`Failed to load timeline. Error: ${err?.message || 'Unknown error'}. Make sure the list/profile is public and the URL is correct.`);
      });
    } catch (err: any) {
      console.error('Error creating embed:', err);
      setError(`Failed to create timeline embed: ${err?.message || 'Unknown error'}`);
    }
  };

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No timeline URL provided</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {mode === 'list' ? 'List Timeline' : 'Profile Timeline'}
        </h3>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
        >
          Open on X →
        </a>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-2">{error}</p>
          <p className="text-red-700 dark:text-red-300 text-xs">
            <strong>Tips:</strong>
            <br />• Make sure the list/profile is public
            <br />• Check the URL format: https://x.com/i/lists/1234567890123456789
            <br />• Try refreshing the page
            <br />• Check browser console (F12) for more details
          </p>
        </div>
      )}

      {!isLoaded && !error && (
        <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading timeline...</p>
            {!scriptReady && (
              <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Initializing widgets...</p>
            )}
            {scriptReady && (
              <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Creating embed...</p>
            )}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        key={embedKeyRef.current}
        className="w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        style={{ minHeight: `${height}px` }}
      />
    </div>
  );
}
