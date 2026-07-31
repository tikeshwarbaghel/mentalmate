import { AppLayout } from "@/components/layout";
import { useGetDoctors } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Star, MapPin, Phone, Mail, Calendar, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DoctorsPage() {
  const { data: doctors, isLoading } = useGetDoctors();
  const { toast } = useToast();

  const handleBook = (doctorName: string) => {
    toast({
      title: "Consultation Request Sent",
      description: `A booking request has been sent to Dr. ${doctorName}. They will contact you shortly.`,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <header className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold tracking-tight"
          >
            Professional Support
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            Connect with recommended mental health professionals when you need extra guidance.
          </motion.p>
        </header>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-[400px] rounded-3xl" />
            ))}
          </div>
        ) : doctors?.length ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {doctors.map((doctor, idx) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * idx }}
              >
                <Card className="h-full flex flex-col rounded-3xl overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                  <CardHeader className="bg-muted/10 pb-4 pt-6 px-6">
                    <div className="flex justify-between items-start mb-4">
                      <Avatar className="w-20 h-20 ring-4 ring-background shadow-sm">
                        <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(doctor.name)}&backgroundColor=c0aede`} alt={doctor.name} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                          {doctor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {doctor.acceptingPatients ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1">Available</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border/50 px-3 py-1">Waitlist</Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold leading-none">{doctor.name}</h3>
                      <div className="flex items-center text-primary font-medium text-sm gap-1.5">
                        <Stethoscope className="w-4 h-4" />
                        {doctor.specialization}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 py-4 flex-1 space-y-4">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-foreground">{doctor.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({doctor.reviewCount} reviews)</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {doctor.bio}
                    </p>

                    <div className="space-y-2.5 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0 text-foreground/40" />
                        <span className="truncate">{doctor.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 shrink-0 text-foreground/40" />
                        <span className="truncate">{doctor.availability}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="px-6 pb-6 pt-0 mt-auto">
                    <Button 
                      className="w-full rounded-full shadow-sm" 
                      onClick={() => handleBook(doctor.name)}
                      variant={doctor.acceptingPatients ? "default" : "secondary"}
                    >
                      {doctor.acceptingPatients ? "Book Consultation" : "Join Waitlist"}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No recommended doctors found in your area at this time.
          </div>
        )}
      </div>
    </AppLayout>
  );
}

