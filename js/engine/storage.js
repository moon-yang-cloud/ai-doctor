/**
 * 本地存储：我的用药记录
 * ---------------------------------------------------------------------------
 * 把问诊得到的用药参考方案保存到 localStorage，便于用户回看历史。
 * 读写做了容错，localStorage 不可用时降级为内存存储。
 * ---------------------------------------------------------------------------
 */

const RECORDS_KEY = "medguide.records.v1";
const RECORDS_LIMIT = 50;

const Store = {
  _mem: {},

  _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return this._mem[key] || null;
    }
  },

  _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      this._mem[key] = value;
    }
  },

  getRecords() {
    return this._read(RECORDS_KEY) || [];
  },

  /** 新增一条用药记录，返回记录 id */
  addRecord(rec) {
    let list = this.getRecords();
    const id = "rec_" + Date.now();
    list.unshift({ id, time: Date.now(), ...rec });
    if (list.length > RECORDS_LIMIT) list = list.slice(0, RECORDS_LIMIT);
    this._write(RECORDS_KEY, list);
    return id;
  },

  removeRecord(id) {
    const list = this.getRecords().filter((r) => r.id !== id);
    this._write(RECORDS_KEY, list);
  },

  clearRecords() {
    this._write(RECORDS_KEY, []);
  },
};

if (typeof window !== "undefined") window.Store = Store;
if (typeof module !== "undefined" && module.exports) module.exports = { Store };
