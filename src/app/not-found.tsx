'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
      <main className='flex min-h-screen w-full max-w-6xl flex-col items-center justify-center py-8 px-8 bg-white dark:bg-black'>
        <div className='max-w-md w-full text-center'>
          <div className='mb-8'>
            <h1 className='text-9xl font-bold text-gray-300 dark:text-gray-700 mb-4'>
              404
            </h1>
            <h2 className='text-2xl font-semibold text-gray-900 dark:text-white mb-2'>
              Page Not Found
            </h2>
            <p className='text-gray-600 dark:text-gray-400 mb-8'>
              Sorry, we couldn&apos;t find the page you&apos;re looking for.
            </p>
          </div>

          <div className='space-y-4'>
            <Link
              href='/'
              className='inline-block w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium py-3 px-6 rounded-lg transition-colors duration-200'
            >
              Go back home
            </Link>

            <button
              onClick={() => window.history.back()}
              className='inline-block w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200'
            >
              Go back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
