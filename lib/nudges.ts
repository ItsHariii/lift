/** Toxic-motivation diet nudges. Server picks one at random per fire. */

export interface Nudge {
  title: string;
  body: string;
}

export const NUDGES: Nudge[] = [
  { title: "LIFT", body: "Chips? Congrats, you're throwing the whole week in the trash." },
  { title: "LIFT", body: "Your abs are in witness protection because YOU buried them." },
  { title: "LIFT", body: "Drop the fork. It's the only rep you'll do today, huh?" },
  { title: "LIFT", body: "Still hungry? No. You're just weak and bored and lying." },
  { title: "LIFT", body: "Nobody's saving your macros. Nobody's watching. Nobody cares but you don't either." },
  { title: "LIFT", body: "Water. WATER. Do I need to spell it slower for you?" },
  { title: "LIFT", body: "The mirror stopped lying. That's why you flinch at it." },
  { title: "LIFT", body: "Strong or soft? You've picked soft every single day of your life." },
  { title: "LIFT", body: "'One cheat.' Your fifth today. You're not dieting, you're cosplaying it." },
  { title: "LIFT", body: "Your excuses outweigh you. Impressive, given the weight." },
  { title: "LIFT", body: "That's not hunger. That's your potential begging you to stop." },
  { title: "LIFT", body: "Close the pantry. Zero surprises in there and zero discipline out here." },
  { title: "LIFT", body: "Future you just watched that. Future you is done defending you." },
  { title: "LIFT", body: "You earned the workout then ate it back like a coward. Efficient." },
  { title: "LIFT", body: "Craving dies in 10 minutes. Your goals have been dead for months." },
  { title: "LIFT", body: "Winners meal-prep. You 'grab something.' Enjoy grabbing nothing forever." },
  { title: "LIFT", body: "It's a diet, not a poll. Your mouth doesn't get a vote today." },
  { title: "LIFT", body: "Eat for the body you want. Oh right — you gave up on wanting one." },
  { title: "LIFT", body: "'Just this once' built everything you hate in that mirror." },
  { title: "LIFT", body: "You've never been hungry a day in your life. Sit down and shut the fridge." },
  { title: "LIFT", body: "Second helping? Bold move for someone losing the first battle." },
  { title: "LIFT", body: "Sugar plays you like a fiddle and you thank it. Pathetic." },
  { title: "LIFT", body: "Did you earn those calories? We both know. Put it back." },
  { title: "LIFT", body: "Weak snack, weak week, weak excuse, weak you. Any questions?" },
  { title: "LIFT", body: "The gains are right across that craving. You'll turn around like always." },
  { title: "LIFT", body: "Average is comfortable. Look how comfortable you've gotten." },
  { title: "LIFT", body: "Even your excuses are tired of covering for you. Eat the chicken." },
  { title: "LIFT", body: "Every bite's a vote and you keep re-electing this body." },
  { title: "LIFT", body: "That gut is a group project and you did all the work." },
  { title: "LIFT", body: "Motivation left months ago. Discipline's on its way out too." },
  { title: "LIFT", body: "You'll start Monday. That's Monday number 200, champ." },
  { title: "LIFT", body: "Nobody's clapping for your cheat day. It's just a slow surrender." },
  { title: "LIFT", body: "The fridge is not a hug. Go find real problems to eat about." },
  { title: "LIFT", body: "Cravings bark and you fetch. Who's really the pet here?" },
  { title: "LIFT", body: "That snack's for people who trained. That's not you and never is." },
  { title: "LIFT", body: "You wanted easy. Easy handed you exactly what you see." },
  { title: "LIFT", body: "One choice from your goal and you'll fumble it like always." },
  { title: "LIFT", body: "Hunger's temporary. That reflection is a lifetime sentence, coward." },
  { title: "LIFT", body: "You came this far just to eat like you never even started. Clown." },
  { title: "LIFT", body: "Sad? The kitchen isn't a therapist. Eat a vegetable and cope." },
  { title: "LIFT", body: "Your dream is starving so your face can chew. Hope it's worth it." },
  { title: "LIFT", body: "You're not hungry, you're understimulated. Go DO something, anything." },
  { title: "LIFT", body: "One 'treat' and you're back at square one. Your favorite address." },
  { title: "LIFT", body: "Scale's not broken. It's just honest, and you can't handle honest." },
  { title: "LIFT", body: "Be unbearable about your food or stay unbearable to look at. Pick." },
  { title: "LIFT", body: "That's not self-care, it's self-sabotage with sprinkles on top." },
  { title: "LIFT", body: "You talk gains and swallow losses. All talk, always." },
  { title: "LIFT", body: "Everyone can tell you 'started a diet.' That's the whole tragedy." },
  { title: "LIFT", body: "Hard now or soft forever. You've been choosing forever." },
  { title: "LIFT", body: "You don't need a snack. You need a spine you clearly misplaced." },
  { title: "LIFT", body: "Eating at midnight? Your metabolism clocked out. Follow it, quitter." },
  { title: "LIFT", body: "Discipline is a muscle and yours has never once been to the gym." },
  { title: "LIFT", body: "The only thing consistent about you is the quitting. Round of applause." },
  { title: "LIFT", body: "You keep feeding the version of you that you keep complaining about." },
  { title: "LIFT", body: "Put it down. For once in your soft little life, put it down." },
  { title: "LIFT", body: "Nobody's coming. No hero, no cheat meal, no Monday. Just you, failing on schedule." },
];

export function randomNudge(): Nudge {
  return NUDGES[Math.floor(Math.random() * NUDGES.length)];
}
