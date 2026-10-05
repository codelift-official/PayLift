import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, MessageCircle, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { apiClient } from '../../api/client';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject cannot exceed 200 characters'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(4000, 'Message cannot exceed 4000 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export const ContactPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    try {
      await apiClient.post('/api/v1/support/contact', data);
      toast.success("We'll get back to you soon.");
      reset();
    } catch {
      // In case endpoint is unreachable, handle gracefully or show error
      toast.error('Unable to send message. Please contact codelift.official@gmail.com directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-8 flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      <div className="w-full max-w-xl space-y-6">
        <Link
          to="/"
          className="inline-flex items-center text-xs font-semibold hover:text-primary transition-colors mb-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Contact Support</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Have questions about your subscription, technical issues, or billing? Reach out to us.
          </p>
        </div>

        <Card
          className="p-6 sm:p-8 shadow-card border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--bg-border)',
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Name"
              placeholder="Your full name"
              {...register('name')}
              error={errors.name?.message}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Subject"
              placeholder="Brief summary of your inquiry"
              {...register('subject')}
              error={errors.subject?.message}
            />

            <div className="space-y-1">
              <label
                className="block text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Message
              </label>
              <textarea
                rows={5}
                placeholder="Describe your inquiry or issue in detail..."
                {...register('message')}
                className="w-full px-3.5 py-2.5 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: errors.message ? '#DC2626' : 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.message && (
                <p className="text-xs font-medium text-danger mt-1">
                  {errors.message.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2 flex items-center justify-center space-x-2"
              isLoading={loading}
            >
              <Send className="w-4 h-4 mr-1" />
              <span>Send Message</span>
            </Button>
          </form>

          {/* Below form contacts */}
          <div
            className="mt-8 pt-6 border-t space-y-3"
            style={{ borderColor: 'var(--bg-border)' }}
          >
            <div className="flex items-center space-x-3 text-sm">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--bg-app)' }}
              >
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Email: </span>
                <a
                  href="mailto:codelift.official@gmail.com"
                  className="font-medium hover:underline text-primary"
                >
                  codelift.official@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--bg-app)' }}
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>WhatsApp: </span>
                <a
                  href="https://wa.me/placeholder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline text-emerald-600"
                >
                  Chat with us on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
