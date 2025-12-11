'use client';

import { useState } from 'react';
import TextureChannelSplitter from '@/components/texturechannelsplitter';
import TextureChannelCombiner from '@/components/texturechannelcombiner';
import TextureResizer from '@/components/textureresizer';

enum TabType {
  SPLITTER = 'splitter',
  COMBINER = 'combiner',
  RESIZER = 'resizer',
}

export default function Home() {
  const [activeComponent, setActiveComponent] = useState<TabType>(
    TabType.SPLITTER
  );

  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
      <main className='flex min-h-screen w-full max-w-6xl flex-col items-center py-8 px-8 bg-white dark:bg-black'>
        {/* Component Switcher */}
        <div className='w-full max-w-2xl mb-6'>
          <div className='flex gap-2 bg-gray-100 p-1 rounded-lg'>
            <button
              onClick={() => setActiveComponent(TabType.SPLITTER)}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${activeComponent === TabType.SPLITTER
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Channel Splitter
            </button>
            <button
              onClick={() => setActiveComponent(TabType.COMBINER)}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${activeComponent === TabType.COMBINER
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Channel Combiner
            </button>
            <button
              onClick={() => setActiveComponent(TabType.RESIZER)}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${activeComponent === TabType.RESIZER
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Texture Resizer
            </button>
          </div>
        </div>

        {/* Active Component */}
        <div className='w-full max-w-4xl flex justify-center'>
          <div className='w-full'>
            {activeComponent === TabType.SPLITTER && <TextureChannelSplitter />}
            {activeComponent === TabType.COMBINER && <TextureChannelCombiner />}
            {activeComponent === TabType.RESIZER && <TextureResizer />}
          </div>
        </div>
      </main>
    </div>
  );
}
