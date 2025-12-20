import { ReactNode } from "react";
import { SuperAdminSidebar } from "./SuperAdminSidebar";

interface SuperAdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export const SuperAdminLayout = ({ children, title, description }: SuperAdminLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-background w-full">
      <SuperAdminSidebar />
      <div className="flex-1 p-4 pt-16 md:pt-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
