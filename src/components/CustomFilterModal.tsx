import { useState, type FormEvent } from 'react';
import {
  X,
  Plus,
  SlidersHorizontal,
  CheckCircle2,
  Trash2,
  Play,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { CustomFilterRule, FilterField, FilterOperator, FilterAction, FolderItem, SmartTag } from '../types';

interface CustomFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterRules: CustomFilterRule[];
  onToggleRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
  onAddRule: (rule: Omit<CustomFilterRule, 'id' | 'matchesCount'>) => void;
  onApplyRulesRetroactively: () => void;
  folders: FolderItem[];
  smartTags: SmartTag[];
}

export default function CustomFilterModal({
  isOpen,
  onClose,
  filterRules,
  onToggleRule,
  onDeleteRule,
  onAddRule,
  onApplyRulesRetroactively,
  folders,
  smartTags,
}: CustomFilterModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [field, setField] = useState<FilterField>('sender');
  const [operator, setOperator] = useState<FilterOperator>('contains');
  const [value, setValue] = useState('');
  const [action, setAction] = useState<FilterAction>('move_to_folder');
  const [actionTarget, setActionTarget] = useState('newsletters');
  const [appliedNotice, setAppliedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSubmitNewRule = (e: FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !value.trim()) return;

    onAddRule({
      name: ruleName.trim(),
      field,
      operator,
      value: value.trim(),
      action,
      actionTarget,
      isActive: true,
    });

    setIsCreating(false);
    setRuleName('');
    setValue('');
  };

  const handleRunNow = () => {
    onApplyRulesRetroactively();
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Custom Filter Rules & Smart Automations
              </h2>
              <p className="text-xs text-slate-500">
                Automatically organize incoming mail into folders, apply smart tags, or separate personal correspondence.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Actions: Run All Rules & Add Rule Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <button
              onClick={handleRunNow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run All Active Filters Now</span>
            </button>

            {appliedNotice && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All rules applied across inbox!
              </span>
            )}

            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Filter</span>
              </button>
            )}
          </div>

          {/* New Rule Creation Form */}
          {isCreating && (
            <form
              onSubmit={handleSubmitNewRule}
              className="p-4 bg-slate-50 border border-indigo-200 rounded-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Define Automated Filter
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Auto-File Substack Newsletters"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    When Condition Field
                  </label>
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value as FilterField)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="sender">Sender Email / Domain</option>
                    <option value="subject">Subject Line</option>
                    <option value="body">Email Body Content</option>
                    <option value="type">Category Type (personal/brand)</option>
                    <option value="budget">Budget Amount (₹ / Rs)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Operator
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value as FilterOperator)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals Exactly</option>
                    <option value="starts_with">Starts With</option>
                    <option value="greater_than">Greater Than (Numbers)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Match Value
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. substack.com or 50000"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Automated Action
                  </label>
                  <select
                    value={action}
                    onChange={(e) => {
                      const act = e.target.value as FilterAction;
                      setAction(act);
                      if (act === 'move_to_folder') setActionTarget(folders[0]?.id || 'inbox');
                      if (act === 'assign_tag') setActionTarget(smartTags[0]?.name || 'High Value');
                      if (act === 'isolate_personal') setActionTarget('personal_vault');
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="move_to_folder">Move to Folder</option>
                    <option value="assign_tag">Assign Smart Tag</option>
                    <option value="isolate_personal">Isolate into Personal Vault</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Target Destination / Tag
                  </label>
                  {action === 'move_to_folder' ? (
                    <select
                      value={actionTarget}
                      onChange={(e) => setActionTarget(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                    >
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  ) : action === 'assign_tag' ? (
                    <select
                      value={actionTarget}
                      onChange={(e) => setActionTarget(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                    >
                      {smartTags.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded-lg font-medium">
                      Personal Vault (Removes from work inbox)
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition"
                >
                  Save & Activate Filter
                </button>
              </div>
            </form>
          )}

          {/* List of Existing Filter Rules */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Configured Filters ({filterRules.length})
            </span>

            {filterRules.map((rule) => (
              <div
                key={rule.id}
                className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                  rule.isActive
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50/70 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    onChange={() => onToggleRule(rule.id)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title={rule.isActive ? 'Active rule' : 'Disabled rule'}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{rule.name}</span>
                      {rule.matchesCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
                          {rule.matchesCount} applied
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      If <strong className="text-slate-700">{rule.field}</strong> {rule.operator} "
                      <strong className="text-indigo-600">{rule.value}</strong>" →{' '}
                      <span className="font-semibold text-slate-700">
                        {rule.action === 'move_to_folder' && `Move to folder "${rule.actionTarget}"`}
                        {rule.action === 'assign_tag' && `Assign tag "${rule.actionTarget}"`}
                        {rule.action === 'isolate_personal' && `Isolate to Personal Vault`}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                  title="Delete filter rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold cursor-pointer transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
