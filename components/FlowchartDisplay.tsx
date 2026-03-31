import React from 'react';
import { FLOWCHART_DETAILS } from '../constants';

const FlowchartDisplay: React.FC = () => {
  return (
    <section className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl border border-gray-700">
      <div className="text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: FLOWCHART_DETAILS }} />
    </section>
  );
};

export default FlowchartDisplay;