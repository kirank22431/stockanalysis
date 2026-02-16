'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import XTimelineEmbed from '@/components/XTimelineEmbed';

interface Account {
  username: string;
  displayName: string;
}

// Stock context suggestions - hardcoded recommendations
const STOCK_ACCOUNT_SUGGESTIONS: Record<string, Account[]> = {
  TSLA: [
    { username: 'tesla', displayName: 'Tesla (@tesla)' },
    { username: 'elonmusk', displayName: 'Elon Musk (@elonmusk)' },
    { username: 'WSJ', displayName: 'Wall Street Journal (@WSJ)' },
    { username: 'CNBC', displayName: 'CNBC (@CNBC)' },
    { username: 'MarketWatch', displayName: 'MarketWatch (@MarketWatch)' },
  ],
  AAPL: [
    { username: 'Apple', displayName: 'Apple (@Apple)' },
    { username: 'tim_cook', displayName: 'Tim Cook (@tim_cook)' },
    { username: 'WSJ', displayName: 'Wall Street Journal (@WSJ)' },
    { username: 'CNBC', displayName: 'CNBC (@CNBC)' },
    { username: 'MarketWatch', displayName: 'MarketWatch (@MarketWatch)' },
  ],
  MSFT: [
    { username: 'Microsoft', displayName: 'Microsoft (@Microsoft)' },
    { username: 'satyanadella', displayName: 'Satya Nadella (@satyanadella)' },
    { username: 'WSJ', displayName: 'Wall Street Journal (@WSJ)' },
    { username: 'CNBC', displayName: 'CNBC (@CNBC)' },
    { username: 'MarketWatch', displayName: 'MarketWatch (@MarketWatch)' },
  ],
  NVDA: [
    { username: 'nvidia', displayName: 'NVIDIA (@nvidia)' },
    { username: 'WSJ', displayName: 'Wall Street Journal (@WSJ)' },
    { username: 'CNBC', displayName: 'CNBC (@CNBC)' },
    { username: 'MarketWatch', displayName: 'MarketWatch (@MarketWatch)' },
    { username: 'Bloomberg', displayName: 'Bloomberg (@Bloomberg)' },
  ],
  AMZN: [
    { username: 'amazon', displayName: 'Amazon (@amazon)' },
    { username: 'JeffBezos', displayName: 'Jeff Bezos (@JeffBezos)' },
    { username: 'WSJ', displayName: 'Wall Street Journal (@WSJ)' },
    { username: 'CNBC', displayName: 'CNBC (@CNBC)' },
    { username: 'MarketWatch', displayName: 'MarketWatch (@MarketWatch)' },
  ],
  GOOGL: [
    { username: 'Google', displayName: 'Google (@Google)' },
    { username: 'sundarpichai', displayName: 'Sundar Pichai (@sundarpichai)' },
    { username: 'WSJ', displayName: 'Wall Street Journal (@WSJ)' },
    { username: 'CNBC', displayName: 'CNBC (@CNBC)' },
    { username: 'MarketWatch', displayName: 'MarketWatch (@MarketWatch)' },
  ],
  META: [
    { username: 'Meta', displayName: 'Meta (@Meta)' },
    { username: 'finkd', displayName: 'Mark Zuckerberg (@finkd)' },
    { username: 'WSJ', displayName: 'Wall Street Journal (@WSJ)' },
    { username: 'CNBC', displayName: 'CNBC (@CNBC)' },
    { username: 'MarketWatch', displayName: 'MarketWatch (@MarketWatch)' },
  ],
};

export default function XCuratedPage() {
  const [listUrl, setListUrl] = useState<string>('');
  const [activeListUrl, setActiveListUrl] = useState<string>('');
  const [accounts, setAccounts] = useState<string[]>([]);
  const [activeAccounts, setActiveAccounts] = useState<string[]>([]);
  const [accountInput, setAccountInput] = useState<string>('');
  const [tickerInput, setTickerInput] = useState<string>('');
  const [currentAccountPage, setCurrentAccountPage] = useState<number>(0);
  const [mode, setMode] = useState<'list' | 'profile'>('list');

  const ACCOUNTS_PER_PAGE = 5;

  // Load from localStorage on mount
  useEffect(() => {
    const savedListUrl = localStorage.getItem('xCuratedListUrl');
    const savedAccounts = localStorage.getItem('xCuratedAccounts');
    
    if (savedListUrl) {
      setListUrl(savedListUrl);
    }
    
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts);
        setAccounts(parsed);
      } catch (e) {
        console.error('Error parsing saved accounts:', e);
      }
    }
  }, []);

  const saveListUrl = () => {
    if (!listUrl.trim()) return;
    
    // Validate URL format
    const listMatch = listUrl.match(/x\.com\/i\/lists\/(\d+)/) || listUrl.match(/twitter\.com\/i\/lists\/(\d+)/);
    if (!listMatch) {
      alert('Please enter a valid X List URL (e.g., https://x.com/i/lists/1234567890123456789)');
      return;
    }

    const listId = listMatch[1];
    const normalizedUrl = `https://x.com/i/lists/${listId}`;
    
    localStorage.setItem('xCuratedListUrl', normalizedUrl);
    setListUrl(normalizedUrl);
    alert('List URL saved!');
  };

  const loadListFeed = () => {
    if (!listUrl.trim()) {
      alert('Please enter a List URL first');
      return;
    }

    const listMatch = listUrl.match(/x\.com\/i\/lists\/(\d+)/) || listUrl.match(/twitter\.com\/i\/lists\/(\d+)/);
    if (!listMatch) {
      alert('Invalid List URL format');
      return;
    }

    const listId = listMatch[1];
    setActiveListUrl(`https://x.com/i/lists/${listId}`);
    setActiveAccounts([]);
    setMode('list');
    setCurrentAccountPage(0);
  };

  const clearList = () => {
    setListUrl('');
    setActiveListUrl('');
    localStorage.removeItem('xCuratedListUrl');
  };

  const addAccount = () => {
    if (!accountInput.trim()) return;

    // Normalize username (remove @ if present, trim)
    let username = accountInput.trim().replace(/^@/, '');
    if (!username) return;

    if (accounts.includes(username)) {
      alert('Account already added');
      return;
    }

    const updated = [...accounts, username];
    setAccounts(updated);
    setAccountInput('');
    localStorage.setItem('xCuratedAccounts', JSON.stringify(updated));
  };

  const removeAccount = (username: string) => {
    const updated = accounts.filter(a => a !== username);
    setAccounts(updated);
    localStorage.setItem('xCuratedAccounts', JSON.stringify(updated));
    
    // Remove from active if present
    if (activeAccounts.includes(username)) {
      setActiveAccounts(updated.filter(a => activeAccounts.includes(a)));
    }
  };

  const loadAccountsFeed = () => {
    if (accounts.length === 0) {
      alert('Please add at least one account');
      return;
    }

    setActiveAccounts(accounts);
    setActiveListUrl('');
    setMode('profile');
    setCurrentAccountPage(0);
  };

  const clearAccounts = () => {
    setAccounts([]);
    setActiveAccounts([]);
    setAccountInput('');
    localStorage.removeItem('xCuratedAccounts');
  };

  const addSuggestedAccount = (username: string) => {
    if (accounts.includes(username)) {
      alert('Account already added');
      return;
    }

    const updated = [...accounts, username];
    setAccounts(updated);
    localStorage.setItem('xCuratedAccounts', JSON.stringify(updated));
  };

  const suggestedAccounts = tickerInput.toUpperCase() in STOCK_ACCOUNT_SUGGESTIONS
    ? STOCK_ACCOUNT_SUGGESTIONS[tickerInput.toUpperCase() as keyof typeof STOCK_ACCOUNT_SUGGESTIONS]
    : [];

  const displayedAccounts = activeAccounts.slice(
    currentAccountPage * ACCOUNTS_PER_PAGE,
    (currentAccountPage + 1) * ACCOUNTS_PER_PAGE
  );
  const totalPages = Math.ceil(activeAccounts.length / ACCOUNTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>

          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Curated X Feed
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View curated X (Twitter) timelines using official embedded widgets
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Settings */}
            <div className="lg:col-span-1 space-y-6">
              {/* Public List Embed */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  A) Public List Embed (Recommended)
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      X List URL
                    </label>
                    <input
                      type="text"
                      value={listUrl}
                      onChange={(e) => setListUrl(e.target.value)}
                      placeholder="https://x.com/i/lists/1234567890123456789"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Example: https://x.com/i/lists/1234567890123456789
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={saveListUrl}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Save List URL
                    </button>
                    <button
                      onClick={loadListFeed}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Load List Feed
                    </button>
                    <button
                      onClick={clearList}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Curated Accounts */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  B) Curated Accounts (Fallback)
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Add Account
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={accountInput}
                        onChange={(e) => setAccountInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addAccount()}
                        placeholder="@username or username"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={addAccount}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {accounts.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Saved Accounts ({accounts.length})
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {accounts.map((username) => (
                          <div
                            key={username}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                          >
                            <span className="text-sm text-gray-900 dark:text-white">@{username}</span>
                            <button
                              onClick={() => removeAccount(username)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={loadAccountsFeed}
                      disabled={accounts.length === 0}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    >
                      Load Accounts Feed
                    </button>
                    <button
                      onClick={clearAccounts}
                      disabled={accounts.length === 0}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    >
                      Clear Accounts
                    </button>
                  </div>
                </div>
              </div>

              {/* Stock Context Helper */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  C) Stock Context Helper (Optional)
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ticker Symbol
                    </label>
                    <input
                      type="text"
                      value={tickerInput}
                      onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                      placeholder="TSLA, AAPL, MSFT..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {suggestedAccounts.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recommended Accounts for {tickerInput}
                      </p>
                      <div className="space-y-2">
                        {suggestedAccounts.map((account) => (
                          <div
                            key={account.username}
                            className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
                          >
                            <span className="text-sm text-gray-900 dark:text-white">
                              {account.displayName}
                            </span>
                            <button
                              onClick={() => addSuggestedAccount(account.username)}
                              disabled={accounts.includes(account.username)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs rounded font-medium transition-colors"
                            >
                              {accounts.includes(account.username) ? 'Added' : 'Add'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Feed Container */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                {mode === 'list' && activeListUrl ? (
                  <XTimelineEmbed mode="list" url={activeListUrl} height={800} />
                ) : mode === 'profile' && activeAccounts.length > 0 ? (
                  <div className="space-y-6">
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => setCurrentAccountPage(Math.max(0, currentAccountPage - 1))}
                          disabled={currentAccountPage === 0}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {currentAccountPage + 1} of {totalPages} ({activeAccounts.length} accounts)
                        </span>
                        <button
                          onClick={() => setCurrentAccountPage(Math.min(totalPages - 1, currentAccountPage + 1))}
                          disabled={currentAccountPage >= totalPages - 1}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}

                    {displayedAccounts.map((username) => (
                      <div key={username} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
                        <XTimelineEmbed
                          mode="profile"
                          url={`https://x.com/${username}`}
                          height={600}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        No feed loaded
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Use the settings panel to load a List feed or add accounts
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Disclaimer:</strong> Social posts can be inaccurate or manipulated. 
                  Educational use only. Not financial advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
