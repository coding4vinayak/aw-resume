import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import axios from 'axios';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Separator } from './components/ui/separator';
import { Plus, Download, Eye, Save, User, Briefcase, GraduationCap, Code, Award, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState({
    id: '',
    title: 'My Resume',
    template_id: 'template1',
    personal_info: {
      full_name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: '',
      summary: ''
    },
    experience: [],
    education: [],
    skills: [],
    projects: []
  });
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [activeTab, setActiveTab] = useState('personal');
  const [previewMode, setPreviewMode] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const resumePreviewRef = useRef(null);

  useEffect(() => {
    fetchTemplates();
    fetchResumes();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchResumes = async () => {
    try {
      const response = await axios.get(`${API}/resumes`);
      setResumes(response.data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const saveResume = async () => {
    try {
      const resumeData = { ...currentResume };
      delete resumeData.id;
      delete resumeData.created_at;
      delete resumeData.updated_at;
      
      if (currentResume.id) {
        await axios.put(`${API}/resumes/${currentResume.id}`, resumeData);
      } else {
        const response = await axios.post(`${API}/resumes`, resumeData);
        setCurrentResume(response.data);
      }
      fetchResumes();
      alert('Resume saved successfully!');
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Error saving resume. Please try again.');
    }
  };

  const loadResume = async (resumeId) => {
    try {
      const response = await axios.get(`${API}/resumes/${resumeId}`);
      setCurrentResume(response.data);
      setSelectedTemplate(response.data.template_id);
    } catch (error) {
      console.error('Error loading resume:', error);
    }
  };

  const deleteResume = async (resumeId) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await axios.delete(`${API}/resumes/${resumeId}`);
        fetchResumes();
        if (currentResume.id === resumeId) {
          setCurrentResume({
            id: '',
            title: 'My Resume',
            template_id: 'template1',
            personal_info: {
              full_name: '',
              email: '',
              phone: '',
              location: '',
              linkedin: '',
              website: '',
              summary: ''
            },
            experience: [],
            education: [],
            skills: [],
            projects: []
          });
        }
      } catch (error) {
        console.error('Error deleting resume:', error);
      }
    }
  };

  const exportToPDF = async () => {
    try {
      const element = resumePreviewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${currentResume.personal_info.full_name || 'Resume'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const addExperience = () => {
    setCurrentResume(prev => ({
      ...prev,
      experience: [...prev.experience, {
        title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        current: false,
        description: ''
      }]
    }));
  };

  const updateExperience = (index, field, value) => {
    setCurrentResume(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index) => {
    setCurrentResume(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setCurrentResume(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: '',
        institution: '',
        location: '',
        graduation_date: '',
        gpa: ''
      }]
    }));
  };

  const updateEducation = (index, field, value) => {
    setCurrentResume(prev => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index) => {
    setCurrentResume(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setCurrentResume(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setCurrentResume(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addProject = () => {
    setCurrentResume(prev => ({
      ...prev,
      projects: [...prev.projects, {
        name: '',
        description: '',
        technologies: '',
        link: ''
      }]
    }));
  };

  const updateProject = (index, field, value) => {
    setCurrentResume(prev => ({
      ...prev,
      projects: prev.projects.map((proj, i) =>
        i === index ? { ...proj, [field]: value } : proj
      )
    }));
  };

  const removeProject = (index) => {
    setCurrentResume(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const ResumePreview = () => {
    const getTemplateStyles = () => {
      switch (selectedTemplate) {
        case 'template1':
          return 'bg-white text-gray-800 font-serif';
        case 'template2':
          return 'bg-white text-gray-900 font-sans';
        case 'template3':
          return 'bg-gray-50 text-gray-800 font-light';
        case 'template4':
          return 'bg-white text-gray-900 font-medium';
        case 'template5':
          return 'bg-white text-gray-800 font-mono text-sm';
        default:
          return 'bg-white text-gray-800 font-sans';
      }
    };

    const getHeaderStyles = () => {
      switch (selectedTemplate) {
        case 'template1':
          return 'border-b-4 border-gray-800 pb-4';
        case 'template2':
          return 'border-l-4 border-blue-500 pl-4';
        case 'template3':
          return 'text-center border-b border-gray-300 pb-6';
        case 'template4':
          return 'bg-gray-900 text-white p-6 -m-8 mb-6';
        case 'template5':
          return 'border border-gray-400 p-4 bg-gray-100';
        default:
          return 'border-b-2 border-gray-600 pb-4';
      }
    };

    const getSectionHeaderStyles = () => {
      switch (selectedTemplate) {
        case 'template1':
          return 'text-lg font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3';
        case 'template2':
          return 'text-xl font-semibold text-blue-600 mb-3';
        case 'template3':
          return 'text-lg font-light text-gray-700 uppercase tracking-wide mb-4';
        case 'template4':
          return 'text-lg font-bold text-gray-900 bg-gray-100 px-3 py-1 mb-3';
        case 'template5':
          return 'text-base font-mono font-bold text-gray-800 border-l-2 border-gray-600 pl-2 mb-3';
        default:
          return 'text-lg font-semibold text-gray-800 mb-3';
      }
    };

    return (
      <div 
        ref={resumePreviewRef}
        className={`w-full max-w-2xl mx-auto p-8 min-h-[800px] shadow-lg ${getTemplateStyles()}`}
        style={{ fontFamily: selectedTemplate === 'template5' ? 'monospace' : 'inherit' }}
      >
        {/* Header */}
        <div className={`mb-6 ${getHeaderStyles()}`}>
          <h1 className={`text-2xl font-bold mb-2 ${selectedTemplate === 'template4' ? 'text-white' : ''}`}>
            {currentResume.personal_info.full_name || 'Your Name'}
          </h1>
          <div className={`text-sm space-y-1 ${selectedTemplate === 'template4' ? 'text-gray-200' : 'text-gray-600'}`}>
            {currentResume.personal_info.email && <div>{currentResume.personal_info.email}</div>}
            {currentResume.personal_info.phone && <div>{currentResume.personal_info.phone}</div>}
            {currentResume.personal_info.location && <div>{currentResume.personal_info.location}</div>}
            {currentResume.personal_info.linkedin && <div>{currentResume.personal_info.linkedin}</div>}
            {currentResume.personal_info.website && <div>{currentResume.personal_info.website}</div>}
          </div>
        </div>

        {/* Summary */}
        {currentResume.personal_info.summary && (
          <div className="mb-6">
            <h2 className={getSectionHeaderStyles()}>Professional Summary</h2>
            <p className="text-sm leading-relaxed">{currentResume.personal_info.summary}</p>
          </div>
        )}

        {/* Experience */}
        {currentResume.experience.length > 0 && (
          <div className="mb-6">
            <h2 className={getSectionHeaderStyles()}>Experience</h2>
            {currentResume.experience.map((exp, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-base">{exp.title}</h3>
                  <span className="text-sm text-gray-600">
                    {exp.start_date} - {exp.current ? 'Present' : exp.end_date}
                  </span>
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">{exp.company}</span>
                  {exp.location && <span className="text-gray-600"> • {exp.location}</span>}
                </div>
                {exp.description && (
                  <p className="text-sm leading-relaxed text-gray-700">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {currentResume.education.length > 0 && (
          <div className="mb-6">
            <h2 className={getSectionHeaderStyles()}>Education</h2>
            {currentResume.education.map((edu, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-base">{edu.degree}</h3>
                  <span className="text-sm text-gray-600">{edu.graduation_date}</span>
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{edu.institution}</span>
                  {edu.location && <span className="text-gray-600"> • {edu.location}</span>}
                  {edu.gpa && <span className="text-gray-600"> • GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {currentResume.skills.length > 0 && (
          <div className="mb-6">
            <h2 className={getSectionHeaderStyles()}>Skills</h2>
            <div className="flex flex-wrap gap-2">
              {currentResume.skills.map((skill, index) => (
                <span 
                  key={index} 
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    selectedTemplate === 'template2' 
                      ? 'bg-blue-100 text-blue-800'
                      : selectedTemplate === 'template4'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {currentResume.projects.length > 0 && (
          <div className="mb-6">
            <h2 className={getSectionHeaderStyles()}>Projects</h2>
            {currentResume.projects.map((project, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <h3 className="font-semibold text-base mb-1">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-gray-700 mb-2">{project.description}</p>
                )}
                {project.technologies && (
                  <p className="text-xs text-gray-600 mb-1">
                    <span className="font-medium">Technologies:</span> {project.technologies}
                  </p>
                )}
                {project.link && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Link:</span> {project.link}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Resume Preview</h1>
            <div className="flex gap-3">
              <Button onClick={() => setPreviewMode(false)} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button onClick={exportToPDF} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
          <ResumePreview />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Resume Creator</h1>
              <Badge variant="secondary" className="ml-3">Free</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={saveResume} variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save Resume
              </Button>
              <Button onClick={() => setPreviewMode(true)} className="bg-blue-600 hover:bg-blue-700">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Resume List */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Your Resumes</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setCurrentResume({
                    id: '',
                    title: 'My Resume',
                    template_id: 'template1',
                    personal_info: {
                      full_name: '',
                      email: '',
                      phone: '',
                      location: '',
                      linkedin: '',
                      website: '',
                      summary: ''
                    },
                    experience: [],
                    education: [],
                    skills: [],
                    projects: []
                  })}
                  className="w-full justify-start bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Resume
                </Button>
                {resumes.map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <button
                      onClick={() => loadResume(resume.id)}
                      className="flex-1 text-left text-sm font-medium text-gray-700 hover:text-blue-600"
                    >
                      {resume.title}
                    </button>
                    <Button
                      onClick={() => deleteResume(resume.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card className="mt-6">
              <CardHeader>
                <h2 className="text-lg font-semibold">Choose Template</h2>
              </CardHeader>
              <CardContent>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-3">
                  <img 
                    src={templates.find(t => t.id === selectedTemplate)?.preview_image} 
                    alt="Template Preview"
                    className="w-full h-32 object-cover rounded border"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Resume Builder */}
          <div className="lg:col-span-9">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Input
                    value={currentResume.title}
                    onChange={(e) => setCurrentResume(prev => ({ ...prev, title: e.target.value }))}
                    className="text-lg font-semibold border-none p-0 focus:ring-0"
                    placeholder="Resume Title"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="personal" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Personal
                    </TabsTrigger>
                    <TabsTrigger value="experience" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Experience
                    </TabsTrigger>
                    <TabsTrigger value="education" className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Education
                    </TabsTrigger>
                    <TabsTrigger value="skills" className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Skills
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Projects
                    </TabsTrigger>
                  </TabsList>

                  {/* Personal Information Tab */}
                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={currentResume.personal_info.full_name}
                          onChange={(e) => setCurrentResume(prev => ({
                            ...prev,
                            personal_info: { ...prev.personal_info, full_name: e.target.value }
                          }))}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={currentResume.personal_info.email}
                          onChange={(e) => setCurrentResume(prev => ({
                            ...prev,
                            personal_info: { ...prev.personal_info, email: e.target.value }
                          }))}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={currentResume.personal_info.phone}
                          onChange={(e) => setCurrentResume(prev => ({
                            ...prev,
                            personal_info: { ...prev.personal_info, phone: e.target.value }
                          }))}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={currentResume.personal_info.location}
                          onChange={(e) => setCurrentResume(prev => ({
                            ...prev,
                            personal_info: { ...prev.personal_info, location: e.target.value }
                          }))}
                          placeholder="New York, NY"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={currentResume.personal_info.linkedin}
                          onChange={(e) => setCurrentResume(prev => ({
                            ...prev,
                            personal_info: { ...prev.personal_info, linkedin: e.target.value }
                          }))}
                          placeholder="linkedin.com/in/johndoe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={currentResume.personal_info.website}
                          onChange={(e) => setCurrentResume(prev => ({
                            ...prev,
                            personal_info: { ...prev.personal_info, website: e.target.value }
                          }))}
                          placeholder="johndoe.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="summary">Professional Summary</Label>
                      <Textarea
                        id="summary"
                        rows={4}
                        value={currentResume.personal_info.summary}
                        onChange={(e) => setCurrentResume(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, summary: e.target.value }
                        }))}
                        placeholder="Brief professional summary highlighting your key achievements and career objectives..."
                      />
                    </div>
                  </TabsContent>

                  {/* Experience Tab */}
                  <TabsContent value="experience" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Work Experience</h3>
                      <Button onClick={addExperience} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Experience
                      </Button>
                    </div>
                    {currentResume.experience.map((exp, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium">Experience #{index + 1}</h4>
                            <Button
                              onClick={() => removeExperience(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label>Job Title</Label>
                              <Input
                                value={exp.title}
                                onChange={(e) => updateExperience(index, 'title', e.target.value)}
                                placeholder="Software Engineer"
                              />
                            </div>
                            <div>
                              <Label>Company</Label>
                              <Input
                                value={exp.company}
                                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                placeholder="Tech Corp"
                              />
                            </div>
                            <div>
                              <Label>Location</Label>
                              <Input
                                value={exp.location}
                                onChange={(e) => updateExperience(index, 'location', e.target.value)}
                                placeholder="San Francisco, CA"
                              />
                            </div>
                            <div>
                              <Label>Start Date</Label>
                              <Input
                                value={exp.start_date}
                                onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                                placeholder="Jan 2022"
                              />
                            </div>
                            <div>
                              <Label>End Date</Label>
                              <Input
                                value={exp.end_date}
                                onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                                placeholder="Present"
                                disabled={exp.current}
                              />
                            </div>
                            <div className="flex items-center space-x-2 mt-6">
                              <input
                                type="checkbox"
                                id={`current-${index}`}
                                checked={exp.current}
                                onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded"
                              />
                              <Label htmlFor={`current-${index}`}>Current Position</Label>
                            </div>
                          </div>
                          <div>
                            <Label>Job Description</Label>
                            <Textarea
                              rows={3}
                              value={exp.description}
                              onChange={(e) => updateExperience(index, 'description', e.target.value)}
                              placeholder="Describe your responsibilities and achievements..."
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  {/* Education Tab */}
                  <TabsContent value="education" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Education</h3>
                      <Button onClick={addEducation} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                    {currentResume.education.map((edu, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium">Education #{index + 1}</h4>
                            <Button
                              onClick={() => removeEducation(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Degree</Label>
                              <Input
                                value={edu.degree}
                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                placeholder="Bachelor of Science in Computer Science"
                              />
                            </div>
                            <div>
                              <Label>Institution</Label>
                              <Input
                                value={edu.institution}
                                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                placeholder="University of Technology"
                              />
                            </div>
                            <div>
                              <Label>Location</Label>
                              <Input
                                value={edu.location}
                                onChange={(e) => updateEducation(index, 'location', e.target.value)}
                                placeholder="Boston, MA"
                              />
                            </div>
                            <div>
                              <Label>Graduation Date</Label>
                              <Input
                                value={edu.graduation_date}
                                onChange={(e) => updateEducation(index, 'graduation_date', e.target.value)}
                                placeholder="May 2021"
                              />
                            </div>
                            <div>
                              <Label>GPA (Optional)</Label>
                              <Input
                                value={edu.gpa}
                                onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                                placeholder="3.8/4.0"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  {/* Skills Tab */}
                  <TabsContent value="skills" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Skills</h3>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill..."
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      />
                      <Button onClick={addSkill} variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentResume.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            onClick={() => removeSkill(index)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Projects Tab */}
                  <TabsContent value="projects" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Projects</h3>
                      <Button onClick={addProject} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Project
                      </Button>
                    </div>
                    {currentResume.projects.map((project, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium">Project #{index + 1}</h4>
                            <Button
                              onClick={() => removeProject(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label>Project Name</Label>
                              <Input
                                value={project.name}
                                onChange={(e) => updateProject(index, 'name', e.target.value)}
                                placeholder="E-commerce Website"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                rows={3}
                                value={project.description}
                                onChange={(e) => updateProject(index, 'description', e.target.value)}
                                placeholder="Describe your project and your role..."
                              />
                            </div>
                            <div>
                              <Label>Technologies Used</Label>
                              <Input
                                value={project.technologies}
                                onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                                placeholder="React, Node.js, MongoDB"
                              />
                            </div>
                            <div>
                              <Label>Project Link (Optional)</Label>
                              <Input
                                value={project.link}
                                onChange={(e) => updateProject(index, 'link', e.target.value)}
                                placeholder="https://github.com/username/project"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;