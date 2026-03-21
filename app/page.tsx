import { dummyLinks } from '@/data/links';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-center">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">MyLink Profile</h1>
      
      <div className="w-full max-w-md flex flex-col gap-4">
        {dummyLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block w-full"
            >
              <Card className="hover:scale-105 transition-transform duration-200 cursor-pointer shadow-sm hover:shadow-md border border-gray-100 bg-white w-full">
                <CardContent className="flex items-center p-4 gap-4">
                  <div className="flex-shrink-0 text-gray-700 group-hover:text-blue-600 transition-colors">
                    <Icon size={24} />
                  </div>
                  <div className="flex-grow font-medium text-gray-800 text-center pr-8">
                    {link.title}
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
