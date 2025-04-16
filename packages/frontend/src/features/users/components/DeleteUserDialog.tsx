import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from '../types';

interface DeleteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
  onConfirmDelete: () => Promise<void>;
}

export const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedUser,
  onConfirmDelete
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eliminar Usuario</DialogTitle>
          <DialogDescription>
            {selectedUser && (
              <>
                ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser.name}</strong>?
                <br /><br />
                <div className="text-amber-600 bg-amber-50 p-3 rounded-md text-sm mb-2">
                  <strong>Advertencia:</strong> No se podrá eliminar el usuario si tiene órdenes de compra asociadas.
                </div>
                <div className="text-red-600 font-semibold">
                  Esta acción no se puede deshacer.
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirmDelete}>
            Eliminar Usuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
