import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Switch } from './components/ui/switch';
import { Progress } from './components/ui/progress';
import { Plus, Download, Eye, Save, User, Briefcase, GraduationCap, Code, Award, Trash2, FileText, 
         MoveUp, MoveDown, Palette, Zap, Star, Link, Trophy, Users, Globe, Camera, Settings, 
         FileImage, FileSpreadsheet } from 'lucide-react';
import { FaLinkedin, FaTwitter, FaGithub, FaInstagram, FaFacebook } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState({
    id: '',
    title: 'My Professional Resume',
    template_id: 'template1',
    personal_info: {
      full_name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      website: '',
      twitter: '',
      summary: '',
      photo_url: ''
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    achievements: [],
    references: [],
    social_links: []
  });
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [activeTab, setActiveTab] = useState('personal');
  const [previewMode, setPreviewMode] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [skillCategory, setSkillCategory] = useState('Technical');
  const [autoSave, setAutoSave] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const resumePreviewRef = useRef(null);
  const autoSaveTimer = useRef(null);

  // Rich text editor modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike', 
    'list', 'bullet', 'indent', 'link'
  ];

  useEffect(() => {
    fetchTemplates();
    fetchResumes();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && currentResume.id) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveResume(true); // Silent save
      }, 3000);
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [currentResume, autoSave]);

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

  const saveResume = async (silent = false) => {
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
      if (!silent) {
        showNotification('Resume saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      if (!silent) {
        showNotification('Error saving resume. Please try again.', 'error');
      }
    }
  };

  const showNotification = (message, type) => {
    // Simple notification - could be enhanced with a proper toast library
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
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
            title: 'My Professional Resume',
            template_id: 'template1',
            personal_info: {
              full_name: '',
              email: '',
              phone: '',
              location: '',
              linkedin: '',
              github: '',
              website: '',
              twitter: '',
              summary: '',
              photo_url: ''
            },
            experience: [],
            education: [],
            skills: [],
            projects: [],
            achievements: [],
            references: [],
            social_links: []
          });
        }
        showNotification('Resume deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting resume:', error);
        showNotification('Error deleting resume.', 'error');
      }
    }
  };

  // Enhanced PDF Export with progress tracking
  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      
      const element = resumePreviewRef.current;
      setExportProgress(25);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      setExportProgress(50);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      setExportProgress(75);

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      setExportProgress(100);
      
      const fileName = `${currentResume.personal_info.full_name || 'Resume'}.pdf`;
      pdf.save(fileName);
      
      showNotification('PDF exported successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('Error generating PDF. Please try again.', 'error');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // New DOC Export functionality
  const exportToDoc = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      
      const { personal_info, experience, education, skills, projects, achievements } = currentResume;
      
      setExportProgress(25);

      // Create document structure
      const children = [];

      // Header
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: personal_info.full_name || 'Your Name',
              bold: true,
              size: 32,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        })
      );

      // Contact Information
      if (personal_info.email || personal_info.phone || personal_info.location) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: [personal_info.email, personal_info.phone, personal_info.location]
                  .filter(Boolean)
                  .join(' | '),
              }),
            ],
            alignment: AlignmentType.CENTER,
          })
        );
      }

      setExportProgress(40);

      // Professional Summary
      if (personal_info.summary) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Professional Summary',
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: personal_info.summary.replace(/<[^>]*>/g, ''), // Strip HTML
              }),
            ],
          }),
          new Paragraph({ children: [] }) // Empty paragraph for spacing
        );
      }

      setExportProgress(55);

      // Experience
      if (experience.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Experience',
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
          })
        );

        experience.forEach(exp => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.title,
                  bold: true,
                }),
                new TextRun({
                  text: ` at ${exp.company}`,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${exp.start_date} - ${exp.current ? 'Present' : exp.end_date}`,
                  italics: true,
                }),
              ],
            })
          );

          if (exp.description) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: exp.description.replace(/<[^>]*>/g, ''),
                  }),
                ],
              })
            );
          }

          children.push(new Paragraph({ children: [] }));
        });
      }

      setExportProgress(70);

      // Education
      if (education.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Education',
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
          })
        );

        education.forEach(edu => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: edu.degree,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${edu.institution} - ${edu.graduation_date}`,
                  italics: true,
                }),
              ],
            })
          );
          children.push(new Paragraph({ children: [] }));
        });
      }

      setExportProgress(85);

      // Skills
      if (skills.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Skills',
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: skills.join(', '),
              }),
            ],
          })
        );
      }

      setExportProgress(95);

      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

      // Generate and save
      const blob = await Packer.toBlob(doc);
      const fileName = `${personal_info.full_name || 'Resume'}.docx`;
      saveAs(blob, fileName);
      
      setExportProgress(100);
      showNotification('DOC exported successfully!', 'success');
    } catch (error) {
      console.error('Error generating DOC:', error);
      showNotification('Error generating DOC. Please try again.', 'error');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Drag and drop handlers
  const handleDragEnd = (result, section) => {
    if (!result.destination) return;

    const items = Array.from(currentResume[section]);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCurrentResume(prev => ({
      ...prev,
      [section]: items
    }));
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
      const skillWithCategory = `${skillCategory}: ${newSkill.trim()}`;
      setCurrentResume(prev => ({
        ...prev,
        skills: [...prev.skills, skillWithCategory]
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
        link: '',
        featured: false
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

  const addAchievement = () => {
    setCurrentResume(prev => ({
      ...prev,
      achievements: [...prev.achievements, {
        title: '',
        description: '',
        date: '',
        organization: ''
      }]
    }));
  };

  const updateAchievement = (index, field, value) => {
    setCurrentResume(prev => ({
      ...prev,
      achievements: prev.achievements.map((ach, i) =>
        i === index ? { ...ach, [field]: value } : ach
      )
    }));
  };

  const removeAchievement = (index) => {
    setCurrentResume(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const addReference = () => {
    setCurrentResume(prev => ({
      ...prev,
      references: [...prev.references, {
        name: '',
        position: '',
        company: '',
        email: '',
        phone: ''
      }]
    }));
  };

  const updateReference = (index, field, value) => {
    setCurrentResume(prev => ({
      ...prev,
      references: prev.references.map((ref, i) =>
        i === index ? { ...ref, [field]: value } : ref
      )
    }));
  };

  const removeReference = (index) => {
    setCurrentResume(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
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
        case 'template6':
          return 'bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900 font-sans';
        case 'template7':
          return 'bg-white text-gray-800 font-serif border-l-4 border-blue-600 pl-8';
        case 'template8':
          return 'bg-gray-900 text-white font-sans';
        case 'template9':
          return 'bg-white text-gray-800 font-sans border-2 border-gray-200';
        case 'template10':
          return 'bg-gradient-to-r from-purple-50 to-pink-50 text-gray-900 font-light';
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
        case 'template6':
          return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 -m-8 mb-6 rounded-lg';
        case 'template7':
          return 'border-b-2 border-blue-600 pb-4';
        case 'template8':
          return 'bg-white text-gray-900 p-6 -m-8 mb-6';
        case 'template9':
          return 'bg-gray-100 p-6 -m-8 mb-6 border-b-4 border-gray-400';
        case 'template10':
          return 'text-center bg-white p-6 -m-8 mb-6 rounded-lg shadow-lg';
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
        case 'template6':
          return 'text-xl font-bold text-indigo-700 mb-3 flex items-center gap-2';
        case 'template7':
          return 'text-lg font-semibold text-blue-700 mb-3 border-l-2 border-blue-600 pl-3';
        case 'template8':
          return 'text-lg font-bold text-white bg-gray-700 px-3 py-1 mb-3';
        case 'template9':
          return 'text-lg font-semibold text-gray-800 bg-gray-100 px-4 py-2 mb-3';
        case 'template10':
          return 'text-xl font-bold text-purple-700 mb-3';
        default:
          return 'text-lg font-semibold text-gray-800 mb-3';
      }
    };

    return (
      <div 
        ref={resumePreviewRef}
        className={`w-full max-w-2xl mx-auto p-8 min-h-[800px] shadow-xl ${getTemplateStyles()}`}
        style={{ 
          fontFamily: selectedTemplate === 'template5' ? 'monospace' : 'inherit',
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.3s ease'
        }}
      >
        {/* Header */}
        <div className={`mb-6 ${getHeaderStyles()}`}>
          <div className="flex items-center gap-4">
            {currentResume.personal_info.photo_url && (
              <img 
                src={currentResume.personal_info.photo_url} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className={`text-2xl font-bold mb-2 ${selectedTemplate === 'template4' || selectedTemplate === 'template8' ? 'text-current' : ''}`}>
                {currentResume.personal_info.full_name || 'Your Name'}
              </h1>
              <div className={`text-sm space-y-1 ${selectedTemplate === 'template4' || selectedTemplate === 'template6' ? 'text-gray-200' : selectedTemplate === 'template8' ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentResume.personal_info.email && <div>{currentResume.personal_info.email}</div>}
                {currentResume.personal_info.phone && <div>{currentResume.personal_info.phone}</div>}
                {currentResume.personal_info.location && <div>{currentResume.personal_info.location}</div>}
                <div className="flex gap-3 mt-2">
                  {currentResume.personal_info.linkedin && (
                    <a href={currentResume.personal_info.linkedin} className="text-blue-500">
                      <FaLinkedin size={16} />
                    </a>
                  )}
                  {currentResume.personal_info.github && (
                    <a href={currentResume.personal_info.github} className="text-gray-700">
                      <FaGithub size={16} />
                    </a>
                  )}
                  {currentResume.personal_info.website && <div>{currentResume.personal_info.website}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        {currentResume.personal_info.summary && (
          <div className="mb-6">
            <h2 className={getSectionHeaderStyles()}>
              <Star className="w-5 h-5" />
              Professional Summary
            </h2>
            <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: currentResume.personal_info.summary }} />
          </div>
        )}

        {/* Experience */}
        {currentResume.experience.length > 0 && (
          <div className="mb-6">
            <h2 className={getSectionHeaderStyles()}>
              <Briefcase className="w-5 h-5" />
              Experience
            </h2>
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
                  <div className="text-sm leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: exp.description }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {currentResume.education.length > 0 && (
          <div className="mb-6">
            <h2 className={getSectionHeaderStyles()}>
              <GraduationCap className="w-5 h-5" />
              Education
            </h2>
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
            <h2 className={getSectionHeaderStyles()}>
              <Code className="w-5 h-5" />
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {currentResume.skills.map((skill, index) => (
                <span 
                  key={index} 
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    selectedTemplate === 'template2' 
                      ? 'bg-blue-100 text-blue-800'
                      : selectedTemplate === 'template4'
                      ? 'bg-gray-200 text-gray-800'
                      : selectedTemplate === 'template6'
                      ? 'bg-indigo-100 text-indigo-800'
                      : selectedTemplate === 'template8'
                      ? 'bg-gray-700 text-white'
                      : selectedTemplate === 'template10'
                      ? 'bg-purple-100 text-purple-800'
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
            <h2 className={getSectionHeaderStyles()}>
              <Award className="w-5 h-5" />
              Projects
            </h2>
            {currentResume.projects.map((project, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base">{project.name}</h3>
                  {project.featured && <Star className="w-4 h-4 text-yellow-500" />}
                </div>
                {project.description && (
                  <div className="text-sm text-gray-700 mb-2" dangerouslySetInnerHTML={{ __html: project.description }} />
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

        {/* Achievements */}
        {currentResume.achievements.length > 0 && (
          <div className="mb-6">
            <h2 className={getSectionHeaderStyles()}>
              <Trophy className="w-5 h-5" />
              Achievements
            </h2>
            {currentResume.achievements.map((achievement, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-base">{achievement.title}</h3>
                  <span className="text-sm text-gray-600">{achievement.date}</span>
                </div>
                {achievement.organization && (
                  <p className="text-sm text-gray-600 mb-1">{achievement.organization}</p>
                )}
                {achievement.description && (
                  <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: achievement.description }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* References */}
        {currentResume.references.length > 0 && (
          <div className="mb-6">
            <h2 className={getSectionHeaderStyles()}>
              <Users className="w-5 h-5" />
              References
            </h2>
            {currentResume.references.map((reference, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <h3 className="font-semibold text-base">{reference.name}</h3>
                <p className="text-sm text-gray-700">{reference.position} at {reference.company}</p>
                <p className="text-xs text-gray-600">
                  {reference.email} {reference.phone && ` • ${reference.phone}`}
                </p>
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">Resume Preview</h1>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                >
                  -
                </Button>
                <span className="text-sm font-medium">{zoomLevel}%</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                >
                  +
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setPreviewMode(false)} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                onClick={exportToPDF} 
                className="bg-red-600 hover:bg-red-700"
                disabled={isExporting}
              >
                <FileText className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                onClick={exportToDoc} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isExporting}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download DOC
              </Button>
            </div>
          </div>
          
          {isExporting && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Exporting resume...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}
          
          <div className="flex justify-center">
            <ResumePreview />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Resume Creator Pro
              </h1>
              <Badge variant="secondary" className="ml-3 bg-green-100 text-green-700">Free</Badge>
              <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700">Enhanced</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
                <Label className="text-sm text-gray-600">Auto-save</Label>
              </div>
              <Button onClick={() => saveResume()} variant="outline" className="hover:bg-blue-50">
                <Save className="w-4 h-4 mr-2" />
                Save Resume
              </Button>
              <Button onClick={() => setPreviewMode(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Resume List & Templates */}
          <div className="lg:col-span-3 space-y-6">
            {/* Resume Management */}
            <Card className="backdrop-blur-md bg-white/80 border-white/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Your Resumes</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setCurrentResume({
                    id: '',
                    title: 'My Professional Resume',
                    template_id: 'template1',
                    personal_info: {
                      full_name: '',
                      email: '',
                      phone: '',
                      location: '',
                      linkedin: '',
                      github: '',
                      website: '',
                      twitter: '',
                      summary: '',
                      photo_url: ''
                    },
                    experience: [],
                    education: [],
                    skills: [],
                    projects: [],
                    achievements: [],
                    references: [],
                    social_links: []
                  })}
                  className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Resume
                </Button>
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  {resumes.map((resume) => (
                    <div key={resume.id} className="flex items-center justify-between p-2 hover:bg-blue-50 rounded transition-colors">
                      <button
                        onClick={() => loadResume(resume.id)}
                        className="flex-1 text-left text-sm font-medium text-gray-700 hover:text-blue-600 truncate"
                      >
                        {resume.title}
                      </button>
                      <Button
                        onClick={() => deleteResume(resume.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card className="backdrop-blur-md bg-white/80 border-white/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold">Choose Template</h2>
                </div>
              </CardHeader>
              <CardContent>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-3">
                  <img 
                    src={templates.find(t => t.id === selectedTemplate)?.preview_image} 
                    alt="Template Preview"
                    className="w-full h-32 object-cover rounded border shadow-sm hover:shadow-md transition-shadow"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    {templates.find(t => t.id === selectedTemplate)?.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="backdrop-blur-md bg-white/80 border-white/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold">Quick Actions</h2>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start hover:bg-red-50"
                  onClick={exportToPDF}
                  disabled={isExporting}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start hover:bg-blue-50"
                  onClick={exportToDoc}
                  disabled={isExporting}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export DOC
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Resume Builder */}
          <div className="lg:col-span-9">
            <Card className="backdrop-blur-md bg-white/90 border-white/30 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Input
                    value={currentResume.title}
                    onChange={(e) => setCurrentResume(prev => ({ ...prev, title: e.target.value }))}
                    className="text-xl font-semibold border-none p-0 focus:ring-0 bg-transparent"
                    placeholder="Resume Title"
                  />
                  <div className="flex items-center gap-2">
                    {autoSave && currentResume.id && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Auto-saved
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-6 bg-gray-100/80 backdrop-blur-sm">
                    <TabsTrigger value="personal" className="flex items-center gap-2 text-xs">
                      <User className="w-3 h-3" />
                      Personal
                    </TabsTrigger>
                    <TabsTrigger value="experience" className="flex items-center gap-2 text-xs">
                      <Briefcase className="w-3 h-3" />
                      Experience
                    </TabsTrigger>
                    <TabsTrigger value="education" className="flex items-center gap-2 text-xs">
                      <GraduationCap className="w-3 h-3" />
                      Education
                    </TabsTrigger>
                    <TabsTrigger value="skills" className="flex items-center gap-2 text-xs">
                      <Code className="w-3 h-3" />
                      Skills
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="flex items-center gap-2 text-xs">
                      <Award className="w-3 h-3" />
                      Projects
                    </TabsTrigger>
                    <TabsTrigger value="extras" className="flex items-center gap-2 text-xs">
                      <Star className="w-3 h-3" />
                      Extras
                    </TabsTrigger>
                  </TabsList>

                  {/* Personal Information Tab */}
                  <TabsContent value="personal" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Full Name *
                        </Label>
                        <Input
                          id="fullName"
                          value={currentResume.personal_info.full_name}
                          onChange={(e) => setCurrentResume(prev => ({
                            ...prev,
                            personal_info: { ...prev.personal_info, full_name: e.target.value }
                          }))}
                          placeholder="John Doe"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={currentResume.personal_info.email}
                          onChange={(e) => setCurrentResume(prev => ({
                            ...prev,
                            personal_info: { ...prev.personal_info, email: e.target.value }
                          }))}
                          placeholder="john@example.com"
                          className="mt-1"
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
                          className="mt-1"
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
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin" className="flex items-center gap-2">
                          <FaLinkedin className="w-4 h-4 text-blue-600" />
                          LinkedIn
                        </Label>
                        <Input
                          id="linkedin"
                          value={currentResume.personal_info.linkedin}
                          onChange={(e) => setCurrentResume(prev => ({
                            ...prev,
                            personal_info: { ...prev.personal_info, linkedin: e.target.value }
                          }))}
                          placeholder="linkedin.com/in/johndoe"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="github" className="flex items-center gap-2">
                          <FaGithub className="w-4 h-4" />
                          GitHub
                        </Label>
                        <Input
                          id="github"
                          value={currentResume.personal_info.github}
                          onChange={(e) => setCurrentResume(prev => ({
                            ...prev,
                            personal_info: { ...prev.personal_info, github: e.target.value }
                          }))}
                          placeholder="github.com/johndoe"
                          className="mt-1"
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
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="photo">Profile Photo URL</Label>
                        <Input
                          id="photo"
                          value={currentResume.personal_info.photo_url}
                          onChange={(e) => setCurrentResume(prev => ({
                            ...prev,
                            personal_info: { ...prev.personal_info, photo_url: e.target.value }
                          }))}
                          placeholder="https://example.com/photo.jpg"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="summary" className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Professional Summary
                      </Label>
                      <ReactQuill
                        value={currentResume.personal_info.summary}
                        onChange={(value) => setCurrentResume(prev => ({
                          ...prev,
                          personal_info: { ...prev.personal_info, summary: value }
                        }))}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Brief professional summary highlighting your key achievements and career objectives..."
                        className="mt-2 bg-white"
                      />
                    </div>
                  </TabsContent>

                  {/* Experience Tab with Drag & Drop */}
                  <TabsContent value="experience" className="space-y-4 mt-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Work Experience
                      </h3>
                      <Button onClick={addExperience} variant="outline" className="bg-green-50 hover:bg-green-100">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Experience
                      </Button>
                    </div>
                    
                    <DragDropContext onDragEnd={(result) => handleDragEnd(result, 'experience')}>
                      <Droppable droppableId="experience">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {currentResume.experience.map((exp, index) => (
                              <Draggable key={index} draggableId={`exp-${index}`} index={index}>
                                {(provided, snapshot) => (
                                  <Card 
                                    ref={provided.innerRef} 
                                    {...provided.draggableProps}
                                    className={`${snapshot.isDragging ? 'shadow-lg' : ''} transition-shadow`}
                                  >
                                    <CardContent className="pt-6">
                                      <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                          <div {...provided.dragHandleProps} className="cursor-move">
                                            <MoveUp className="w-4 h-4 text-gray-400" />
                                          </div>
                                          <h4 className="font-medium">Experience #{index + 1}</h4>
                                        </div>
                                        <Button
                                          onClick={() => removeExperience(index)}
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                          <Label>Job Title *</Label>
                                          <Input
                                            value={exp.title}
                                            onChange={(e) => updateExperience(index, 'title', e.target.value)}
                                            placeholder="Software Engineer"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label>Company *</Label>
                                          <Input
                                            value={exp.company}
                                            onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                            placeholder="Tech Corp"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label>Location</Label>
                                          <Input
                                            value={exp.location}
                                            onChange={(e) => updateExperience(index, 'location', e.target.value)}
                                            placeholder="San Francisco, CA"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label>Start Date</Label>
                                          <Input
                                            value={exp.start_date}
                                            onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                                            placeholder="Jan 2022"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label>End Date</Label>
                                          <Input
                                            value={exp.end_date}
                                            onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                                            placeholder="Present"
                                            disabled={exp.current}
                                            className="mt-1"
                                          />
                                        </div>
                                        <div className="flex items-center space-x-2 mt-6">
                                          <Switch
                                            id={`current-${index}`}
                                            checked={exp.current}
                                            onCheckedChange={(checked) => updateExperience(index, 'current', checked)}
                                          />
                                          <Label htmlFor={`current-${index}`}>Current Position</Label>
                                        </div>
                                      </div>
                                      <div>
                                        <Label>Job Description</Label>
                                        <ReactQuill
                                          value={exp.description}
                                          onChange={(value) => updateExperience(index, 'description', value)}
                                          modules={quillModules}
                                          formats={quillFormats}
                                          placeholder="Describe your responsibilities and achievements..."
                                          className="mt-2 bg-white"
                                        />
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </TabsContent>

                  {/* Education Tab */}
                  <TabsContent value="education" className="space-y-4 mt-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        Education
                      </h3>
                      <Button onClick={addEducation} variant="outline" className="bg-blue-50 hover:bg-blue-100">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                    
                    <DragDropContext onDragEnd={(result) => handleDragEnd(result, 'education')}>
                      <Droppable droppableId="education">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {currentResume.education.map((edu, index) => (
                              <Draggable key={index} draggableId={`edu-${index}`} index={index}>
                                {(provided, snapshot) => (
                                  <Card 
                                    ref={provided.innerRef} 
                                    {...provided.draggableProps}
                                    className={`${snapshot.isDragging ? 'shadow-lg' : ''} transition-shadow`}
                                  >
                                    <CardContent className="pt-6">
                                      <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                          <div {...provided.dragHandleProps} className="cursor-move">
                                            <MoveUp className="w-4 h-4 text-gray-400" />
                                          </div>
                                          <h4 className="font-medium">Education #{index + 1}</h4>
                                        </div>
                                        <Button
                                          onClick={() => removeEducation(index)}
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <Label>Degree *</Label>
                                          <Input
                                            value={edu.degree}
                                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                            placeholder="Bachelor of Science in Computer Science"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label>Institution *</Label>
                                          <Input
                                            value={edu.institution}
                                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                            placeholder="University of Technology"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label>Location</Label>
                                          <Input
                                            value={edu.location}
                                            onChange={(e) => updateEducation(index, 'location', e.target.value)}
                                            placeholder="Boston, MA"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label>Graduation Date</Label>
                                          <Input
                                            value={edu.graduation_date}
                                            onChange={(e) => updateEducation(index, 'graduation_date', e.target.value)}
                                            placeholder="May 2021"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label>GPA (Optional)</Label>
                                          <Input
                                            value={edu.gpa}
                                            onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                                            placeholder="3.8/4.0"
                                            className="mt-1"
                                          />
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </TabsContent>

                  {/* Enhanced Skills Tab */}
                  <TabsContent value="skills" className="space-y-4 mt-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Code className="w-5 h-5" />
                        Skills & Technologies
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Skill Category</Label>
                        <Select value={skillCategory} onValueChange={setSkillCategory}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Technical">Technical</SelectItem>
                            <SelectItem value="Programming">Programming</SelectItem>
                            <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                            <SelectItem value="Languages">Languages</SelectItem>
                            <SelectItem value="Tools">Tools</SelectItem>
                            <SelectItem value="Certifications">Certifications</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Add Skill</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="e.g., React, JavaScript, Leadership..."
                            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                          />
                          <Button onClick={addSkill} variant="outline" className="bg-purple-50 hover:bg-purple-100">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {currentResume.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 px-3 py-1">
                          {skill}
                          <button
                            onClick={() => removeSkill(index)}
                            className="ml-1 hover:text-red-600 text-gray-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Enhanced Projects Tab */}
                  <TabsContent value="projects" className="space-y-4 mt-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Projects & Portfolio
                      </h3>
                      <Button onClick={addProject} variant="outline" className="bg-yellow-50 hover:bg-yellow-100">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Project
                      </Button>
                    </div>
                    
                    <DragDropContext onDragEnd={(result) => handleDragEnd(result, 'projects')}>
                      <Droppable droppableId="projects">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {currentResume.projects.map((project, index) => (
                              <Draggable key={index} draggableId={`proj-${index}`} index={index}>
                                {(provided, snapshot) => (
                                  <Card 
                                    ref={provided.innerRef} 
                                    {...provided.draggableProps}
                                    className={`${snapshot.isDragging ? 'shadow-lg' : ''} transition-shadow`}
                                  >
                                    <CardContent className="pt-6">
                                      <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                          <div {...provided.dragHandleProps} className="cursor-move">
                                            <MoveUp className="w-4 h-4 text-gray-400" />
                                          </div>
                                          <h4 className="font-medium">Project #{index + 1}</h4>
                                          <Switch
                                            checked={project.featured}
                                            onCheckedChange={(checked) => updateProject(index, 'featured', checked)}
                                          />
                                          <Label className="text-sm">Featured</Label>
                                        </div>
                                        <Button
                                          onClick={() => removeProject(index)}
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      <div className="grid grid-cols-1 gap-4">
                                        <div>
                                          <Label>Project Name *</Label>
                                          <Input
                                            value={project.name}
                                            onChange={(e) => updateProject(index, 'name', e.target.value)}
                                            placeholder="E-commerce Platform"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label>Project Description</Label>
                                          <ReactQuill
                                            value={project.description}
                                            onChange={(value) => updateProject(index, 'description', value)}
                                            modules={quillModules}
                                            formats={quillFormats}
                                            placeholder="Describe your project and your role..."
                                            className="mt-2 bg-white"
                                          />
                                        </div>
                                        <div>
                                          <Label>Technologies Used</Label>
                                          <Input
                                            value={project.technologies}
                                            onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                                            placeholder="React, Node.js, MongoDB, AWS"
                                            className="mt-1"
                                          />
                                        </div>
                                        <div>
                                          <Label>Project Link</Label>
                                          <Input
                                            value={project.link}
                                            onChange={(e) => updateProject(index, 'link', e.target.value)}
                                            placeholder="https://github.com/username/project"
                                            className="mt-1"
                                          />
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </TabsContent>

                  {/* Extras Tab - Achievements & References */}
                  <TabsContent value="extras" className="space-y-6 mt-6">
                    {/* Achievements Section */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-600" />
                          Achievements & Awards
                        </h3>
                        <Button onClick={addAchievement} variant="outline" className="bg-yellow-50 hover:bg-yellow-100">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Achievement
                        </Button>
                      </div>
                      
                      {currentResume.achievements.map((achievement, index) => (
                        <Card key={index} className="mb-4">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium">Achievement #{index + 1}</h4>
                              <Button
                                onClick={() => removeAchievement(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Achievement Title *</Label>
                                <Input
                                  value={achievement.title}
                                  onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                                  placeholder="Employee of the Year"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label>Date</Label>
                                <Input
                                  value={achievement.date}
                                  onChange={(e) => updateAchievement(index, 'date', e.target.value)}
                                  placeholder="2023"
                                  className="mt-1"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label>Organization</Label>
                                <Input
                                  value={achievement.organization}
                                  onChange={(e) => updateAchievement(index, 'organization', e.target.value)}
                                  placeholder="Tech Corp"
                                  className="mt-1"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label>Description</Label>
                                <ReactQuill
                                  value={achievement.description}
                                  onChange={(value) => updateAchievement(index, 'description', value)}
                                  modules={quillModules}
                                  formats={quillFormats}
                                  placeholder="Describe your achievement..."
                                  className="mt-2 bg-white"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Separator />

                    {/* References Section */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Users className="w-5 h-5 text-green-600" />
                          Professional References
                        </h3>
                        <Button onClick={addReference} variant="outline" className="bg-green-50 hover:bg-green-100">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Reference
                        </Button>
                      </div>
                      
                      {currentResume.references.map((reference, index) => (
                        <Card key={index} className="mb-4">
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium">Reference #{index + 1}</h4>
                              <Button
                                onClick={() => removeReference(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Full Name *</Label>
                                <Input
                                  value={reference.name}
                                  onChange={(e) => updateReference(index, 'name', e.target.value)}
                                  placeholder="Jane Smith"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label>Position</Label>
                                <Input
                                  value={reference.position}
                                  onChange={(e) => updateReference(index, 'position', e.target.value)}
                                  placeholder="Senior Manager"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label>Company</Label>
                                <Input
                                  value={reference.company}
                                  onChange={(e) => updateReference(index, 'company', e.target.value)}
                                  placeholder="Tech Corp"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label>Email</Label>
                                <Input
                                  value={reference.email}
                                  onChange={(e) => updateReference(index, 'email', e.target.value)}
                                  placeholder="jane.smith@techcorp.com"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label>Phone</Label>
                                <Input
                                  value={reference.phone}
                                  onChange={(e) => updateReference(index, 'phone', e.target.value)}
                                  placeholder="(555) 123-4567"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
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