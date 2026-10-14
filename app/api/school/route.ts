import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {eligible,validDate,contractSnapshot,today} from '../../../lib/rules';
export const dynamic='force-dynamic';
type Row=Record<string,any>;
class Issue extends Error {constructor(message:string,public status=400){super(message);}}
const names=['students','courses','classes','enrollments','lessons','attendance','assessments','grades','events'] as const;
const id=z.string().min(1).max(80),str=z.string().trim(),date=str.refine(validDate,'Data inválida.');
const studentSchema=z.object({name:str.min(3).max(120),email:z.union([str.email(),z.literal('')]).default(''),phone:str.max(25).default(''),document:str.max(25).default(''),birth:z.union([date,z.literal('')]).default(''),guardian:str.max(160).default(''),address:str.max(300).default(''),status:z.enum(['active','inactive']).default('active')});
const schemas:Record<string,z.ZodTypeAny>={
 student:studentSchema.extend({id:id.optional()}),
 course:z.object({name:str.min(2).max(120),hours:z.coerce.number().int().min(1).max(10000)}),
 class:z.object({course_id:id,name:str.min(2).max(120),teacher:str.min(2).max(120),schedule:str.min(2).max(180),capacity:z.coerce.number().int().min(1).max(500)}),
 enrollment:z.object({student_id:id,class_id:id,enrolled_on:date,amount:z.coerce.number().min(0).max(1000000),installments:z.coerce.number().int().min(1).max(120)}),
 endEnrollment:z.object({id,ended_on:date}),
 lesson:z.object({class_id:id,date,topic:str.min(2).max(300)}),
 attendance:z.object({lesson_id:id,records:z.array(z.object({enrollment_id:id,status:z.enum(['present','absent'])})).max(500)}),
 assessment:z.object({class_id:id,date,title:str.min(2).max(120)}),
 grades:z.object({assessment_id:id,records:z.array(z.object({enrollment_id:id,score:z.number().min(0).max(10).nullable()})).max(500)})
};
function db(){if(!env.DB)throw new Issue('Banco indisponível. Tente novamente.',503);return env.DB;}
function identity(r:Request){const owner=r.headers.get('oai-authenticated-user-id');if(!owner)throw new Issue('Entre na sua conta para acessar o sistema.',401);return owner;}
function respond(error:unknown){if(error instanceof Issue)return Response.json({error:error.message},{status:error.status});if(error instanceof z.ZodError)return Response.json({error:'Confira os campos: '+error.issues.map(i=>i.path.join('.')+': '+i.message).join('; ')},{status:400});console.error('school request failed',error instanceof Error?error.message:'unknown');return Response.json({error:'Não foi possível salvar os dados. Tente novamente.'},{status:500});}
const uid=()=>crypto.randomUUID();
async function parent(table:string,id:string,owner:string){const row=await db().prepare(`SELECT * FROM ${table} WHERE id=? AND owner=?`).bind(id,owner).first<Row>();if(!row)throw new Issue('Registro não encontrado.',404);return row;}
function insert(table:string,row:Row){const keys=Object.keys(row);return db().prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).bind(...keys.map(k=>row[k]));}
function event(owner:string,message:string){return insert('events',{id:uid(),owner,message,created_at:new Date().toISOString()});}
export async function GET(r:Request){try{const owner=identity(r);const results=await db().batch(names.map(n=>db().prepare(`SELECT * FROM ${n} WHERE owner=? ${n==='events'?'ORDER BY created_at DESC LIMIT 15':''}`).bind(owner)));return Response.json(Object.fromEntries(names.map((n,i)=>[n,results[i].results])),{headers:{'Cache-Control':'no-store'}});}catch(e){return respond(e);}}
export async function POST(r:Request){try{
 const owner=identity(r);if(r.headers.get('origin')&&r.headers.get('origin')!==new URL(r.url).origin)throw new Issue('Origem inválida.',403);
 const body=await r.json() as Row,action=body.action; if(action==='demo'){await seed(owner);return Response.json({ok:true});}
 if(!schemas[action])throw new Issue('Operação inválida.');const p=schemas[action].parse(body.data) as Row;let statements:D1PreparedStatement[]=[],message='',resultId=uid();
 if(action==='student'){
 if(p.birth&&p.birth>today())throw new Issue('A data de nascimento não pode estar no futuro.');
 if(p.id){await parent('students',p.id,owner);const {id:studentId,...fields}=p;statements.push(db().prepare(`UPDATE students SET ${Object.keys(fields).map(k=>k+'=?').join(',')} WHERE id=? AND owner=?`).bind(...Object.values(fields),studentId,owner));resultId=studentId;message='Cadastro de aluno atualizado';}
 else {statements.push(insert('students',{...p,id:resultId,owner,created_at:new Date().toISOString()}));message='Novo aluno cadastrado';}
 }
 if(action==='course'){statements.push(insert('courses',{...p,id:resultId,owner}));message='Novo curso cadastrado';}
 if(action==='class'){await parent('courses',p.course_id,owner);statements.push(insert('classes',{...p,id:resultId,owner,status:'active'}));message='Nova turma cadastrada';}
 if(action==='enrollment'){
 const s=await parent('students',p.student_id,owner),c=await parent('classes',p.class_id,owner);if(s.status!=='active'||c.status!=='active')throw new Issue('Aluno e turma precisam estar ativos.');
 const duplicate=await db().prepare('SELECT id FROM enrollments WHERE student_id=? AND class_id=? AND owner=?').bind(p.student_id,p.class_id,owner).first();if(duplicate)throw new Issue('Este aluno já possui matrícula nesta turma.',409);
 const course=await parent('courses',c.course_id,owner);const snapshot=contractSnapshot(s,{...c,course_name:course.name},p as any);
 // Capacidade também é conferida no INSERT para impedir concorrência além do limite.
 const fields={...p,id:resultId,owner,ended_on:null,status:'active',contract:snapshot};const keys=Object.keys(fields);
 const inserted=await db().prepare(`INSERT INTO enrollments (${keys.join(',')}) SELECT ${keys.map(()=>'?').join(',')} WHERE (SELECT COUNT(*) FROM enrollments WHERE class_id=? AND owner=? AND status='active') < ?`).bind(...Object.values(fields),p.class_id,owner,c.capacity).run();if(!inserted.meta.changes)throw new Issue('A turma atingiu sua capacidade.',409);message='Matrícula criada e contrato gerado';
 }
 if(action==='endEnrollment'){const e=await parent('enrollments',p.id,owner);if(p.ended_on<e.enrolled_on||p.ended_on>today())throw new Issue('Informe uma data entre a matrícula e hoje.');const later=await db().prepare(`SELECT id FROM attendance WHERE enrollment_id=? AND owner=? AND lesson_id IN (SELECT id FROM lessons WHERE date>?) UNION SELECT id FROM grades WHERE enrollment_id=? AND owner=? AND assessment_id IN (SELECT id FROM assessments WHERE date>?) LIMIT 1`).bind(p.id,owner,p.ended_on,p.id,owner,p.ended_on).first();if(later)throw new Issue('Existem lançamentos após esta data. Escolha uma data posterior aos registros.');statements.push(db().prepare("UPDATE enrollments SET status='ended',ended_on=? WHERE id=? AND owner=?").bind(p.ended_on,p.id,owner));message='Matrícula encerrada';}
 if(action==='lesson'||action==='assessment'){await parent('classes',p.class_id,owner);if(p.date>today())throw new Issue('Registre aulas e avaliações em uma data até hoje.');statements.push(insert(action==='lesson'?'lessons':'assessments',{...p,id:resultId,owner,...(action==='lesson'?{attendance_saved:0}:{})}));message=action==='lesson'?'Aula registrada':'Avaliação criada';}
 if(action==='attendance'||action==='grades'){
 const isCall=action==='attendance',item=await parent(isCall?'lessons':'assessments',isCall?p.lesson_id:p.assessment_id,owner);
 const all=(await db().prepare('SELECT * FROM enrollments WHERE owner=? AND class_id=?').bind(owner,item.class_id).all<Row>()).results.filter(e=>eligible(e as any,item.date));
 const ids=p.records.map((x:Row)=>x.enrollment_id);if(new Set(ids).size!==ids.length||ids.some((x:string)=>!all.some(e=>e.id===x)))throw new Issue('Lista de alunos inválida.');
 if(isCall&&(ids.length!==all.length||!all.length))throw new Issue('Marque presença ou falta para todos os alunos elegíveis.');
 if(isCall)statements.push(db().prepare('DELETE FROM attendance WHERE lesson_id=? AND owner=?').bind(item.id,owner));
 for(const record of p.records){if(isCall)statements.push(insert('attendance',{id:uid(),owner,lesson_id:item.id,...record}));else {statements.push(db().prepare('DELETE FROM grades WHERE assessment_id=? AND enrollment_id=? AND owner=?').bind(item.id,record.enrollment_id,owner));if(record.score!==null)statements.push(insert('grades',{id:uid(),owner,assessment_id:item.id,...record}));}}
 if(isCall)statements.push(db().prepare('UPDATE lessons SET attendance_saved=1 WHERE id=? AND owner=?').bind(item.id,owner));message=isCall?'Chamada salva':'Notas atualizadas';
 }
 statements.push(event(owner,message));await db().batch(statements);return Response.json({ok:true,id:resultId});
 }catch(e){return respond(e);}}
async function seed(owner:string){
 const c=await db().prepare('SELECT id FROM students WHERE owner=? UNION SELECT id FROM courses WHERE owner=? LIMIT 1').bind(owner,owner).first();if(c)throw new Issue('Os exemplos só podem ser carregados em um sistema vazio.',409);
 const course=uid(),group=uid(),st=[uid(),uid(),uid()],en=st.map(uid),lessonIds=[uid(),uid(),uid()],assessment=uid();const current=today(),older=new Date(current+'T12:00:00Z');older.setUTCDate(older.getUTCDate()-7);const first=older.toISOString().slice(0,10);older.setUTCDate(older.getUTCDate()+3);const middle=older.toISOString().slice(0,10);
 const groupRow={id:group,owner,course_id:course,name:'Informática • Turma A',teacher:'Professor de demonstração',schedule:'Terças e quintas, 19h às 21h',capacity:20,status:'active'};
 const ops=[insert('courses',{id:course,owner,name:'Informática profissional',hours:80}),insert('classes',groupRow)];
 ['Aluno Exemplo 01','Aluno Exemplo 02','Aluno Exemplo 03'].forEach((name,i)=>{const student={id:st[i],owner,name,email:'',phone:'',document:'DEMONSTRAÇÃO',birth:'',guardian:'',address:'Poá-SP • endereço fictício',status:'active',created_at:new Date().toISOString()};ops.push(insert('students',student));const details={enrolled_on:first,amount:600,installments:6};ops.push(insert('enrollments',{id:en[i],owner,student_id:st[i],class_id:group,...details,ended_on:null,status:'active',contract:contractSnapshot(student,{...groupRow,course_name:'Informática profissional'},details)}));});
 [first,middle,current].forEach((d,i)=>{ops.push(insert('lessons',{id:lessonIds[i],owner,class_id:group,date:d,topic:['Introdução ao computador','Organização de arquivos','Editor de textos'][i],attendance_saved:i<2?1:0}));if(i<2)en.forEach((e,j)=>ops.push(insert('attendance',{id:uid(),owner,lesson_id:lessonIds[i],enrollment_id:e,status:j===1&&i===1?'absent':'present'})));});
 ops.push(insert('assessments',{id:assessment,owner,class_id:group,date:middle,title:'Atividade prática 1'}));en.forEach((e,i)=>ops.push(insert('grades',{id:uid(),owner,assessment_id:assessment,enrollment_id:e,score:[8.5,7,9][i]})));ops.push(event(owner,'Exemplos fictícios carregados'));await db().batch(ops);
}
