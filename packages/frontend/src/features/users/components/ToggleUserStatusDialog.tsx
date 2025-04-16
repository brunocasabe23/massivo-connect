import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX } from 'lucide-react';
import { User } from '../types';

interface ToggleUserStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
  onConfirmToggle: () => Promise<void>;
}

export const ToggleUserStatusDialog: React.FC<ToggleUserStatusDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedUser,
  onConfirmToggle
}) => {
  // Determinar si estamos activando o desactivando (ignorando mayúsculas/minúsculas)
  const isActivating = selectedUser?.status?.toLowerCase() !== 'activo';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isActivating ? 'Activar Usuario' : 'Desactivar Usuario'}
          </DialogTitle>
          <DialogDescription>
            {selectedUser && (
              <>
                ¿Estás seguro de que deseas {isActivating ? 'activar' : 'desactivar'} al usuario <strong>{selectedUser.name}</strong>?
                <br /><br />
                {isActivating ? (
                  <div className="text-green-600 bg-green-50 p-3 rounded-md text-sm mb-2">
                    <strong>Nota:</strong> Al activar el usuario, este podrá iniciar sesión y utilizar el sistema nuevamente.
                  </div>
                ) : (
                  <div className="text-amber-600 bg-amber-50 p-3 rounded-md text-sm mb-2">
                    <strong>Advertencia:</strong> Al desactivar el usuario, este no podrá iniciar sesión ni utilizar el sistema hasta que sea activado nuevamente.
                  </div>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            variant={isActivating ? "default" : "destructive"}
            onClick={onConfirmToggle}
            className={isActivating ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isActivating ? (
              <><UserCheck className="mr-2 h-4 w-4" />Activar Usuario</>
            ) : (
              <><UserX className="mr-2 h-4 w-4" />Desactivar Usuario</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
