import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VictimConditionCardProps {
  condition: string;
  onConditionChange: (value: string) => void;
}

export default function VictimConditionCard({ condition, onConditionChange }: VictimConditionCardProps) {
  return (
    <Card className="opacity-0 animate-slide-up stagger-2 border-0 shadow-lg shadow-black/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold">
            2
          </span>
          Victim Condition
        </CardTitle>
        <CardDescription className="text-xs">Assess and report the victim&apos;s current state</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Condition Select */}
        <div className="space-y-2">
          <Label htmlFor="condition" className="text-sm font-medium">
            Current Condition
          </Label>
          <Select value={condition} onValueChange={onConditionChange} name="condition">
            <SelectTrigger id="condition" className="w-full">
              <SelectValue placeholder="Select victim condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conscious">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-success" />
                  Stable — Conscious &amp; responsive
                </div>
              </SelectItem>
              <SelectItem value="injured">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-warning" />
                  Injured — Needs medical attention
                </div>
              </SelectItem>
              <SelectItem value="critical">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-emergency" />
                  Critical — Life-threatening
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Condition badge */}
          {condition && (
            <Badge
              className={`text-xs ${condition === "conscious"
                  ? "bg-brand-success/10 text-brand-success border-brand-success/20"
                  : condition === "injured"
                    ? "bg-brand-warning/10 text-amber-700 border-brand-warning/20"
                    : "bg-brand-emergency/10 text-brand-emergency border-brand-emergency/20 animate-pulse-emergency"
                }`}
              variant="outline"
            >
              {condition === "conscious" && "✅ Stable"}
              {condition === "injured" && "⚠️ Injured"}
              {condition === "critical" && "🚨 Critical — Priority Response"}
            </Badge>
          )}
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Additional Notes
          </Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Describe the situation, injuries, number of victims, hazards present..."
            className="min-h-[80px] resize-none text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}

