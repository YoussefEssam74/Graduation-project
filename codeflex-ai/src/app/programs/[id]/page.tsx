import { notFound } from "next/navigation";
import Link from "next/link";
import { USER_PROGRAMS } from "@/constants";

type Params = { params: { id: string } };

export default function ProgramDetailsPage({ params }: Params) {
  const id = Number(params.id || 0);
  const program = USER_PROGRAMS.find((p) => p.id === id);

  if (!program) return notFound();

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{program.workout_plan.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Program by {program.first_name} • {program.fitness_goal}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-primary hover:underline">Back</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <section className="p-6 border border-border rounded-lg bg-card/50">
          <h3 className="font-semibold mb-2">Workout Overview</h3>
          <p className="text-sm text-muted-foreground mb-4">{program.workout_plan.description}</p>

          <div className="space-y-3">
            {program.workout_plan.weekly_schedule.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between bg-background/40 rounded px-3 py-2">
                <div>
                  <strong>{s.day}</strong>
                  <div className="text-sm text-muted-foreground">{s.focus}</div>
                </div>
                <div className="text-sm text-muted-foreground">{s.duration}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 border border-border rounded-lg bg-card/50">
          <h3 className="font-semibold mb-2">Nutrition Plan</h3>
          <p className="text-sm text-muted-foreground mb-4">{program.diet_plan.description}</p>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Calories: <strong>{program.diet_plan.daily_calories}</strong></div>
            <div className="text-sm text-muted-foreground">Macros: <strong>{JSON.stringify(program.diet_plan.macros)}</strong></div>
            <div className="mt-3">
              <ul className="list-disc px-6 text-sm text-muted-foreground space-y-1">
                {program.diet_plan.meal_examples.map((m, i) => (
                  <li key={i}><strong>{m.meal}:</strong> {m.example}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 border border-border rounded-lg bg-card/50">
        <div className="flex items-center gap-4 mb-4">
          <img src={program.profilePic} alt={program.first_name} className="h-12 w-12 rounded-full object-cover border" />
          <div>
            <div className="font-semibold">{program.first_name}</div>
            <div className="text-sm text-muted-foreground">{program.age} years • {program.fitness_level} • {program.equipment_access}</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">{program.workout_plan.description}</div>
      </div>
    </div>
  );
}
