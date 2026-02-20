import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { companyContextSchema } from "@shared/schema";
import { useGenerateArchitecture } from "@/hooks/use-architecture";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Building2, Globe2, Briefcase } from "lucide-react";
import { motion } from "framer-motion";

// Schema for the form - needs to match the backend expectation
const formSchema = companyContextSchema;
type FormValues = z.infer<typeof formSchema>;

export default function InputForm() {
  const { mutate, isPending } = useGenerateArchitecture();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      businessModel: "B2B",
      region: "",
      dataSources: [],
      toolsUsed: {
        crm: "",
        marketingAutomation: "",
        analytics: "",
      },
      activationChannels: [],
    },
  });

  const onSubmit = (data: FormValues) => {
    mutate(data);
  };

  const industries = ["Retail", "Finance", "Healthcare", "SaaS", "Manufacturing", "E-commerce"];
  
  const regions = [
    { label: "North America", countries: ["USA", "Canada", "Mexico", "Costa Rica"] },
    { label: "Europe", countries: ["UK", "Germany", "France", "Spain", "Italy", "Netherlands"] },
    { label: "Asia", countries: ["India", "China", "Japan", "Singapore", "UAE", "Malaysia"] },
    { label: "Middle East", countries: ["UAE", "Saudi Arabia", "Qatar", "Oman"] },
    { label: "Africa", countries: ["South Africa", "Kenya", "Nigeria", "Egypt"] },
    { label: "Oceania", countries: ["Australia", "New Zealand", "Fiji"] }
  ];

  const dataSources = ["Website", "Mobile App", "POS", "ERP", "Call Center", "Social Media", "IoT"];
  const channels = ["Email", "SMS", "Push Notifications", "WhatsApp", "Paid Media", "Direct Mail"];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-slate-50/50">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Architect Your Growth
            </h1>
            <p className="text-lg text-muted-foreground mt-4 max-w-xl mx-auto">
              Tell us about your company, and ARC+ will generate a customized maturity model, architecture diagram, and customer journeys.
            </p>
          </motion.div>
        </div>

        <Card className="p-8 shadow-xl border-t-4 border-t-primary">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Basic Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" className="h-12 text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Business Model</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="B2B">B2B (Business to Business)</SelectItem>
                          <SelectItem value="B2C">B2C (Business to Consumer)</SelectItem>
                          <SelectItem value="Both">Both / Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Globe2 className="w-4 h-4 text-primary" /> Region / Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regions.map(region => (
                            <div key={region.label}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-slate-50">
                                {region.label}
                              </div>
                              {region.countries.map(country => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Data Sources */}
              <div className="space-y-4">
                <FormLabel className="text-lg font-semibold text-primary">Data Sources</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dataSources.map((source) => (
                    <FormField
                      key={source}
                      control={form.control}
                      name="dataSources"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={source}
                            className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-slate-50 transition-colors"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(source)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, source])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== source
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer text-sm">
                              {source}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Tools Stack */}
              <div className="space-y-4">
                <FormLabel className="text-lg font-semibold text-primary">Current Tech Stack</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="toolsUsed.crm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CRM</FormLabel>
                        <FormControl>
                          <Input placeholder="Salesforce, HubSpot..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="toolsUsed.marketingAutomation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marketing Automation</FormLabel>
                        <FormControl>
                          <Input placeholder="Marketo, Braze..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="toolsUsed.analytics"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Analytics</FormLabel>
                        <FormControl>
                          <Input placeholder="GA4, Mixpanel..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="toolsUsed.dataWarehouse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Warehouse (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Snowflake, BigQuery..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

               {/* Activation Channels */}
               <div className="space-y-4">
                <FormLabel className="text-lg font-semibold text-primary">Activation Channels</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {channels.map((channel) => (
                    <FormField
                      key={channel}
                      control={form.control}
                      name="activationChannels"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={channel}
                            className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-slate-50 transition-colors"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(channel)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, channel])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== channel
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer text-sm">
                              {channel}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isPending}
                  className="w-full h-16 text-lg font-bold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 transition-all"
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Analyzing & Generating Architecture...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Generate ARC+ Model
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
