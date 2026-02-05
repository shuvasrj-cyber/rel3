
import React, { useState, useEffect } from 'react';
import { Member, Relation, RelationType, AppView } from './types';
import { db } from './db';
import MemberForm from './components/MemberForm';
import RelationLinker from './components/RelationLinker';
import FamilyTree from './components/FamilyTree';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [members, setMembers] = useState<Member[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await db.init();
        const [m, r] = await Promise.all([
          db.getAllMembers(),
          db.getAllRelations()
        ]);
        setMembers(m);
        setRelations(r);
      } catch (error) {
        console.error("Data loading failed", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddMember = async (newMember: Member, relation?: { toId: string; type: RelationType }) => {
    try {
      await db.addMember(newMember);
      const updatedMembers = [...members, newMember];
      setMembers(updatedMembers);

      if (relation) {
        const newRel: Relation = {
          id: crypto.randomUUID(),
          fromId: newMember.id,
          toId: relation.toId,
          type: relation.type
        };
        await db.addRelation(newRel);
        setRelations([...relations, newRel]);
      }
      setView('home');
    } catch (e) {
      alert("सुरक्षित गर्न सकिएन।");
    }
  };

  const handleLinkMembers = async (fromId: string, toId: string, type: RelationType) => {
    try {
      const newRel: Relation = {
        id: crypto.randomUUID(),
        fromId,
        toId,
        type
      };
      await db.addRelation(newRel);
      setRelations([...relations, newRel]);
      setView('home');
    } catch (e) {
      alert("सम्बन्ध सुरक्षित गर्न सकिएन।");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-blue-800 font-bold">डाटा लोड हुँदैछ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-gray-50 overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="bg-blue-800 text-white p-4 shadow-lg flex items-center justify-between shrink-0">
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <span>🌿</span> वंशावली रेकर्ड
        </h1>
        <div className="text-xs bg-blue-700 px-3 py-1 rounded-full border border-blue-500">
          कुल सदस्य: {members.length}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        {view === 'home' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl">
              <h2 className="text-2xl font-bold mb-2">स्वागत छ!</h2>
              <p className="opacity-90">आफ्नो परिवारको वंशावली रेकर्ड सुरक्षित र व्यवस्थित राख्नुहोस्।</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <button 
                  onClick={() => setView('add_member')}
                  className="bg-white text-blue-700 px-6 py-2 rounded-xl font-bold hover:bg-blue-50 transition"
                >
                  + सदस्य थप्नुहोस्
                </button>
                <button 
                  onClick={() => setView('tree_view')}
                  className="bg-blue-500/30 backdrop-blur text-white border border-blue-400 px-6 py-2 rounded-xl font-bold hover:bg-blue-500/50 transition"
                >
                  वंशावली रेखाचित्र
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                   <span className="text-5xl block mb-4">📂</span>
                   <p className="text-gray-400 font-semibold">अहिलेसम्म कुनै सदस्य थपिएको छैन।</p>
                </div>
              ) : (
                members.map(member => (
                  <div key={member.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
                    <div className="w-16 h-16 rounded-full bg-gray-100 shrink-0 overflow-hidden border-2 border-blue-100">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">👤</div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{member.name}</h3>
                      <p className="text-xs text-gray-500">{member.address || 'ठेगाना नखुलेको'}</p>
                      <p className="text-xs text-blue-600 font-medium">{member.mobile || 'फोन नभएको'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === 'add_member' && (
          <MemberForm 
            onSave={handleAddMember} 
            existingMembers={members} 
            onCancel={() => setView('home')} 
          />
        )}

        {view === 'link_members' && (
          <RelationLinker 
            members={members} 
            onLink={handleLinkMembers} 
            onCancel={() => setView('home')} 
          />
        )}

        {view === 'tree_view' && (
          <div className="h-full">
            <FamilyTree members={members} relations={relations} />
          </div>
        )}
      </main>

      {/* Bottom Navigation (Sticky Call-to-Action) */}
      <nav className="fixed bottom-0 left-0 right-0 md:relative bg-white border-t p-2 flex justify-around shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
        <button 
          onClick={() => setView('home')}
          className={`flex flex-col items-center p-2 rounded-xl transition ${view === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-bold">गृह</span>
        </button>
        <button 
          onClick={() => setView('add_member')}
          className={`flex flex-col items-center p-2 rounded-xl transition ${view === 'add_member' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
        >
          <span className="text-xl">👤</span>
          <span className="text-[10px] font-bold">थप्नुहोस्</span>
        </button>
        <button 
          onClick={() => setView('link_members')}
          className={`flex flex-col items-center p-2 rounded-xl transition ${view === 'link_members' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
        >
          <span className="text-xl">🔗</span>
          <span className="text-[10px] font-bold">जोड्नुहोस्</span>
        </button>
        <button 
          onClick={() => setView('tree_view')}
          className={`flex flex-col items-center p-2 rounded-xl transition ${view === 'tree_view' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
        >
          <span className="text-xl">🌳</span>
          <span className="text-[10px] font-bold">चित्र</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
