import React from 'react';
import { APP_DESCRIPTION_HTML } from '../constants';

const Introduction: React.FC = () => {
  return (
    <section className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl border border-gray-700">
      <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center font-display">SKYNETchat - V1</h2>
      <div className="text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: APP_DESCRIPTION_HTML }} />
    </section>
  );
};

export default Introduction;