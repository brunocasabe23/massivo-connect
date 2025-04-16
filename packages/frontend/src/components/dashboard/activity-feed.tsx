import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentActivity } from '@/services/dashboard.service';
import { Loader2, Activity, Clock, Filter } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface ActivityFeedProps {
  activities: RecentActivity[];
  loading: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg font-medium">
            <Activity className="mr-2 h-5 w-5 text-[#005291]" />
            Actividad Reciente
          </CardTitle>
          {/* Podemos agregar un filtro aquí en el futuro */}
          {/* <Filter className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" /> */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-4 text-slate-500">
              No hay actividades recientes para mostrar
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-[#005291] text-white">
                    {activity.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold text-[#005291]">{activity.user}</span>{' '}
                    <span>{activity.action}</span>
                    {activity.target && (
                      <>
                        {' '}<span className="font-medium text-slate-700">{activity.target}</span>
                      </>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-xs text-slate-500" title={activity.exactDate}>
                      <Clock className="mr-1 h-3 w-3" />
                      {activity.time}
                    </div>
                    {activity.entityType && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5 rounded-full bg-slate-50 text-slate-600 border-slate-200">
                        {activity.entityType.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
