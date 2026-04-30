'use client';

import { useState } from 'react';
import TextureChannelSplitter from '@/components/texturechannelsplitter';
import TextureChannelCombiner from '@/components/texturechannelcombiner';
import TextureResizer from '@/components/textureresizer';
import SpriteExtractor from '@/components/spriteextractor';
import SpriteWhiteSpaceRemover from '@/components/spritewhitespaceremover';

enum TabType {
  TEXTURE_SPLITTER = 'texture_splitter',
  TEXTURE_COMBINER = 'texture_combiner',
  TEXTURE_RESIZER = 'texture_resizer',
  SPRITE_EXTRACTOR = 'sprite_extractor',
  SPRITE_WHITE_SPACE_REMOVER = 'sprite_white_space_remover',
}

export default function Home() {
  const [activeComponent, setActiveComponent] = useState<TabType>(
    TabType.TEXTURE_SPLITTER
  );

  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
      <main className='flex min-h-screen w-full max-w-6xl flex-col items-center py-8 px-8 bg-white dark:bg-black'>
        <h1 className='text-4xl font-bold mb-8 text-gray-900 dark:text-white'>
          Texture Manipulator
        </h1>

        {/* Component Switcher */}
        <div className='w-auto mb-6'>
          <div className='flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg justify-center'>
            <button
              onClick={() => setActiveComponent(TabType.TEXTURE_SPLITTER)}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeComponent === TabType.TEXTURE_SPLITTER
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Channel Splitter
            </button>
            <button
              onClick={() => setActiveComponent(TabType.TEXTURE_COMBINER)}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeComponent === TabType.TEXTURE_COMBINER
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Channel Combiner
            </button>
            <button
              onClick={() => setActiveComponent(TabType.TEXTURE_RESIZER)}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeComponent === TabType.TEXTURE_RESIZER
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Texture Resizer
            </button>
            <button
              onClick={() => setActiveComponent(TabType.SPRITE_EXTRACTOR)}
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeComponent === TabType.SPRITE_EXTRACTOR
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Sprite Extractor
            </button>
            <button
              onClick={() =>
                setActiveComponent(TabType.SPRITE_WHITE_SPACE_REMOVER)
              }
              className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeComponent === TabType.SPRITE_WHITE_SPACE_REMOVER
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Sprite White Space Remover
            </button>
          </div>
        </div>

        {/* Active Component */}
        <div className='w-full max-w-4xl flex justify-center'>
          <div className='w-full'>
            {activeComponent === TabType.TEXTURE_SPLITTER && (
              <TextureChannelSplitter />
            )}
            {activeComponent === TabType.TEXTURE_COMBINER && (
              <TextureChannelCombiner />
            )}
            {activeComponent === TabType.TEXTURE_RESIZER && <TextureResizer />}
            {activeComponent === TabType.SPRITE_EXTRACTOR && (
              <SpriteExtractor />
            )}
            {activeComponent === TabType.SPRITE_WHITE_SPACE_REMOVER && (
              <SpriteWhiteSpaceRemover />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
