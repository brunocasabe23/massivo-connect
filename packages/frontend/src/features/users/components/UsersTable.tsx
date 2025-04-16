import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Edit, ShieldCheck, UserX, UserCheck, Trash } from 'lucide-react';
import { formatDate } from "@/utils/date-utils";
import { User } from '../types';
import { getRoleBadgeColor, getStatusBadgeColor, generateInitials } from '../utils/format-utils';

interface UsersTableProps {
  loading: boolean;
  error: string | null;
  users: User[];
  onEditUser: (user: User) => void;
  onManagePermissions: (user: User) => void;
  onToggleUserStatus: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  loading,
  error,
  users,
  onEditUser,
  onManagePermissions,
  onToggleUserStatus,
  onDeleteUser
}) => {
  if (loading) {
    return (
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={`loading-${index}`}>
            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  }

  if (error) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={8} className="h-24 text-center text-red-500">
            Error: {error}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (users.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={8} className="h-24 text-center">
            No se encontraron usuarios que coincidan con los filtros.
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12"><Checkbox /></TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const initials = !user.avatar && user.name
              ? generateInitials(user.name)
              : '??';

            return (
              <TableRow key={user.id}>
                <TableCell><Checkbox /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {user.avatar ?
                        <AvatarImage src={user.avatar} /> :
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-[#005291] text-white">
                          {initials}
                        </AvatarFallback>
                      }
                    </Avatar>
                    <div className="font-medium">{user.name}</div>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(user.status)}>{user.status}</Badge>
                </TableCell>
                <TableCell>{formatDate(user.createdAt, false)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditUser(user)}>
                        <Edit className="mr-2 h-4 w-4" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onManagePermissions(user)}>
                        <ShieldCheck className="mr-2 h-4 w-4" />Gestionar permisos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleUserStatus(user)}>
                        {user.status.toLowerCase() === "activo" ? (
                          <span><UserX className="mr-2 h-4 w-4" />Desactivar</span>
                        ) : (
                          <span><UserCheck className="mr-2 h-4 w-4" />Activar</span>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onClick={() => onDeleteUser(user)}>
                        <Trash className="mr-2 h-4 w-4" />Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
