import React from 'react';
import { ParqueoManager } from '../ParqueoManager';

export const AdminParqueoTab: React.FC = () => {
  return (
    <div className="w-full space-y-4">
      <ParqueoManager />
    </div>
  );
};

export default AdminParqueoTab;
