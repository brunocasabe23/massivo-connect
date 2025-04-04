import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PermissionsDebug: React.FC = () => {
  const { user, permisos } = useAuth();

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Información de Depuración</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Usuario:</h3>
            <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold">Permisos ({permisos.length}):</h3>
            <ul className="list-disc pl-5">
              {permisos.map((permiso, index) => (
                <li key={index} className="text-sm">{permiso}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PermissionsDebug;
