import Link from 'next/link';
export default function Home() {
    return (<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-extrabold text-gray-900">
          Transform Research into Powerful Prompts
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Unlock the full potential of your research by converting complex documents into precise, actionable prompts for AI models.
        </p>
        <div className="mt-8">
          <Link href="/dashboard" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            Get Started
          </Link>
        </div>
      </div>
    </div>);
}
