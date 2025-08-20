import React from 'react';

const AboutPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-blue-800 mb-4 animate-fadeIn">
          About Our Platform 🚀
        </h1>
        <p className="mt-3 text-lg sm:text-2xl text-gray-700 max-w-2xl leading-relaxed animate-fadeIn delay-200">
          Welcome to **Nadataes**, your premier destination for preparing for the CAS assessment. We are dedicated to providing the most effective and comprehensive practice tools.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl">
          <div className="p-6 border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 bg-white animate-fadeIn delay-400">
            <h2 className="text-2xl font-semibold text-blue-600 mb-2">Practice for Success</h2>
            <p className="text-gray-600">
              Our platform offers a wide range of practice tests and mock assessments meticulously designed to simulate the real CAS exam experience. With unlimited practice opportunities, you can hone your skills and build confidence.
            </p>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 bg-white animate-fadeIn delay-600">
            <h2 className="text-2xl font-semibold text-blue-600 mb-2">Unlimited Learning</h2>
            <p className="text-gray-600">
              Practice as much as you need, whenever you want. Our flexible platform ensures you have the resources to prepare at your own pace, mastering every concept required for the assessment.
            </p>
          </div>
        </div>

        <p className="mt-8 text-md sm:text-xl text-gray-600 animate-fadeIn delay-800">
          Join us and take the first step towards a successful career!
        </p>
      </main>
    </div>
  );
};

export default AboutPage;