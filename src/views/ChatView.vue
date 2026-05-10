<template>
  <div class="min-h-screen bg-dark pt-20 flex flex-col">
    <div class="flex flex-1 max-w-6xl mx-auto w-full px-4 gap-3 pt-4 pb-4" style="height:calc(100vh - 5rem)">

      <!-- Sidebar conversations -->
      <div class="w-72 shrink-0 hidden md:flex flex-col gap-2">
        <h2 class="font-display text-xl font-bold text-white px-1 mb-2">Chat</h2>
        <div class="flex-1 overflow-y-auto scrollbar-hide space-y-1.5">
          <div v-if="loadingConvos" v-for="i in 4" :key="i" class="bento-muted h-16 animate-pulse rounded-2xl"></div>
          <div v-for="c in conversations" :key="c.id" @click="selectConv(c)"
            :class="['flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all',
              activeConv?.id===c.id ? 'bg-red-600/20 border border-red-600/30' : 'hover:bg-white/5 border border-transparent']">
            <div class="relative shrink-0">
              <img :src="c.partner?.avatar_url" class="w-10 h-10 rounded-full object-cover"/>
              <span v-if="c.unread_count>0"
                class="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                {{ c.unread_count > 9 ? '9+' : c.unread_count }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">{{ c.partner?.name }}</p>
              <p class="text-white/40 text-xs truncate">{{ lastMsgPreview(c) }}</p>
            </div>
          </div>
          <p v-if="!loadingConvos && !conversations.length" class="text-white/30 text-sm px-2 py-4 text-center">
            Belum ada chat aktif.
          </p>
        </div>
      </div>

      <!-- Chat window -->
      <div class="flex-1 flex flex-col bento-dark border border-white/10 overflow-hidden min-w-0">

        <!-- Header -->
        <div v-if="activeConv" class="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0 flex-wrap gap-y-2">
          <router-link :to="`/profile/${activeConv.partner?.id}`" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img :src="activeConv.partner?.avatar_url" class="w-9 h-9 rounded-full object-cover"/>
            <div>
              <p class="text-white font-semibold text-sm">{{ activeConv.partner?.name }}</p>
              <p class="text-white/40 text-xs">{{ activeConv.offer_skill?.name }} ↔ {{ activeConv.want_skill?.name }}</p>
            </div>
          </router-link>
          <div class="ml-auto flex gap-2 flex-wrap">
            <span :class="statusClass(activeConv.status)" class="text-xs px-3 py-1.5 rounded-full font-medium">
              {{ statusLabel(activeConv.status) }}
            </span>
            <template v-if="activeConv.status === 'accepted'">
              <button @click="openSessionModal=true" class="btn-ghost !px-3 !py-1.5 !text-xs">📅 Jadwal</button>
              <button @click="openQuizModal=true"    class="btn-ghost !px-3 !py-1.5 !text-xs">📝 Quiz</button>
              <button @click="openCertModal=true"    class="btn-ghost !px-3 !py-1.5 !text-xs">🎓 Sertifikat</button>
            </template>
          </div>
        </div>

        <div v-if="!activeConv" class="flex-1 flex items-center justify-center">
          <div class="text-center"><div class="text-5xl mb-3">💬</div><p class="text-white/30">Pilih percakapan</p></div>
        </div>

        <!-- Messages -->
        <div v-if="activeConv" ref="msgBox" class="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">

          <!-- Sessions banners -->
          <div v-for="sess in activeSessions" :key="`s-${sess.id}`"
            class="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3">
            <span class="text-xl">📅</span>
            <div class="flex-1">
              <p class="text-blue-300 font-semibold text-xs">Sesi Terjadwal</p>
              <p class="text-white/60 text-xs">{{ formatFull(sess.scheduled_at) }} · {{ sess.duration_minutes }} menit · {{ sess.location||'TBD' }}</p>
            </div>
          </div>

          <!-- Quiz progress tracker -->
          <div v-if="quizProgress.length && activeConv.status === 'accepted'"
            class="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <p class="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">Progress Belajar</p>
            <div class="space-y-1.5">
              <div v-for="p in quizProgress" :key="p.quiz.id" class="flex items-center gap-3">
                <span class="text-sm">{{ p.isMyQuiz ? '📤' : '📥' }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-white text-xs font-medium truncate">{{ p.quiz.title }}</p>
                  <p class="text-white/30 text-[10px]">{{ p.isMyQuiz ? 'Quiz kamu' : 'Quiz dari ' + activeConv.partner?.name }}</p>
                </div>
                <span v-if="p.isMyQuiz"
                  :class="['text-[10px] font-semibold px-2.5 py-1 rounded-full',
                    p.theirAttempt?.tutor_approved ? 'bg-green-500/20 text-green-400'
                    : p.theirAttempt?.passed       ? 'bg-amber-500/20 text-amber-400'
                    : p.theirAttempt               ? 'bg-red-500/20 text-red-400'
                                                   : 'bg-white/5 text-white/30']">
                  {{ p.theirAttempt?.tutor_approved ? '✓ Selesai'
                     : p.theirAttempt?.passed       ? '⏳ Tunggu acc'
                     : p.theirAttempt               ? '✗ Tidak lulus'
                                                    : '— Belum' }}
                </span>
                <span v-else
                  :class="['text-[10px] font-semibold px-2.5 py-1 rounded-full',
                    p.myAttempt?.tutor_approved ? 'bg-green-500/20 text-green-400'
                    : p.myAttempt?.passed       ? 'bg-amber-500/20 text-amber-400'
                    : p.myAttempt               ? 'bg-red-500/20 text-red-400'
                                               : 'bg-white/5 text-white/30']">
                  {{ p.myAttempt?.tutor_approved ? '✓ Selesai'
                     : p.myAttempt?.passed       ? '⏳ Tunggu acc'
                     : p.myAttempt               ? '✗ Tidak lulus'
                                                : '— Belum' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quiz banners -->
          <div v-for="quiz in activeQuizzes" :key="`q-${quiz.id}`"
            class="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-3">
            <span class="text-xl">📝</span>
            <div class="flex-1 min-w-0">
              <p class="text-purple-300 font-semibold text-xs">{{ quiz.title }}</p>
              <p class="text-white/40 text-xs">{{ quiz.creator?.name }} · Min. lulus: {{ quiz.pass_score ?? 70 }}%</p>
            </div>
            <div class="flex gap-2 shrink-0">
              <button v-if="quiz.creator_id !== auth.user?.id && !hasAttempted(quiz.id)"
                @click="openQuizAttempt(quiz)" class="btn-primary !text-xs !px-3 !py-1.5">
                Kerjakan
              </button>
              <span v-if="quiz.creator_id !== auth.user?.id && hasAttempted(quiz.id)"
                class="text-green-400 text-xs font-medium self-center">✓ Selesai</span>
              <button v-if="quiz.creator_id === auth.user?.id"
                @click="openAttemptsPanel(quiz)" class="btn-ghost !text-xs !px-3 !py-1.5">
                Lihat Hasil
              </button>
            </div>
          </div>

          <!-- Pending approvals for quiz creator -->
          <div v-for="ap in pendingApprovals" :key="`ap-${ap.id}`"
            class="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-2xl px-4 py-3">
            <span class="text-xl">✅</span>
            <div class="flex-1 min-w-0">
              <p class="text-green-300 font-semibold text-xs">
                {{ ap.user?.name }} lulus "{{ ap.quiz?.title }}" — {{ ap.score }}%
              </p>
              <p class="text-white/40 text-xs">Setujui untuk menyelesaikan pertukaran skill ini</p>
            </div>
            <button @click="approveAttempt(ap)" :disabled="approvingId === ap.id"
              class="btn-primary !text-xs !px-3 !py-1.5 shrink-0 flex items-center gap-1.5">
              <span v-if="approvingId===ap.id" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Setujui
            </button>
          </div>

          <!-- Chat messages -->
          <div v-for="msg in messages" :key="msg.id"
            :class="['flex gap-2', msg.sender_id === auth.user?.id ? 'justify-end' : 'justify-start']">
            <div v-if="msg.sender_id !== auth.user?.id" class="shrink-0 self-end">
              <img :src="msg.sender_avatar_url" class="w-7 h-7 rounded-full object-cover"/>
            </div>
            <div class="max-w-[72%] flex flex-col gap-0.5">
              <div v-if="msg.body && msg.body.trim()"
                :class="['px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words',
                  msg.sender_id === auth.user?.id ? 'bg-red-600 text-white rounded-br-md' : 'bg-white/10 text-white rounded-bl-md']">
                {{ msg.body }}
              </div>

              <!-- FIX: Use attachment_url from API (built with url() helper on backend) -->
              <div v-if="msg.attachment_url"
                :class="['rounded-2xl overflow-hidden border',
                  msg.sender_id === auth.user?.id ? 'border-red-500/30' : 'border-white/10']">
                <template v-if="isImage(msg.attachment_type)">
                  <img :src="msg.attachment_url" :alt="msg.attachment_name"
                    class="max-w-full max-h-64 object-cover cursor-pointer block"
                    @click="lightboxImg = msg.attachment_url"/>
                  <a :href="msg.attachment_url" target="_blank"
                    class="block px-3 py-1.5 bg-white/5 text-white/40 text-[10px] hover:text-white transition-colors">
                    {{ msg.attachment_name }}
                  </a>
                </template>
                <template v-else>
                  <a :href="msg.attachment_url" target="_blank" rel="noopener"
                    class="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors">
                    <span class="text-3xl shrink-0">{{ fileIcon(msg.attachment_type) }}</span>
                    <div class="min-w-0 flex-1">
                      <p class="text-white text-sm font-medium truncate">{{ msg.attachment_name }}</p>
                      <p class="text-white/40 text-xs">Download</p>
                    </div>
                  </a>
                </template>
              </div>

              <p :class="['text-[10px]', msg.sender_id === auth.user?.id ? 'text-right text-white/40' : 'text-white/30']">
                {{ formatTime(msg.created_at) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Input bar -->
        <div v-if="activeConv?.status === 'accepted'" class="px-4 py-3 border-t border-white/10 shrink-0">
          <div v-if="attachmentFile" class="flex items-center gap-3 bg-white/5 rounded-2xl px-3 py-2 mb-2">
            <span class="text-xl">{{ fileIcon(attachmentFile.type) }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-white/70 text-xs truncate">{{ attachmentFile.name }}</p>
              <p class="text-white/30 text-[10px]">{{ formatBytes(attachmentFile.size) }}</p>
            </div>
            <button @click="removeAttachment" class="text-white/40 hover:text-red-400 transition-colors text-lg">×</button>
          </div>
          <form @submit.prevent="sendMessage" class="flex items-center gap-2">
            <label class="p-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-white/50 hover:text-white shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
              </svg>
              <input ref="fileInput" type="file" class="hidden"
                accept="image/jpeg,image/png,image/gif,application/pdf,.doc,.docx,.zip,.txt"
                @change="pickFile"/>
            </label>
            <input v-model="newMsg" type="text" placeholder="Ketik pesan..." class="input-light flex-1 !py-2.5 !text-sm"/>
            <button type="submit" :disabled="(!newMsg.trim() && !attachmentFile) || sending"
              class="btn-primary !px-4 !py-2.5 shrink-0 flex items-center justify-center min-w-[52px]">
              <span v-if="sending" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </form>
        </div>

        <div v-else-if="activeConv?.status === 'completed'" class="px-4 py-3 border-t border-white/10 shrink-0 text-center">
          <p class="text-white/30 text-sm">Exchange selesai.</p>
          <button v-if="!hasRated" @click="ratingModal=true" class="btn-primary !text-xs !px-4 !py-2 mt-2">⭐ Beri Rating</button>
          <p v-else class="text-green-400 text-xs mt-1">✓ Rating sudah dikirim</p>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div v-if="lightboxImg" class="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" @click="lightboxImg=null">
      <img :src="lightboxImg" class="max-w-full max-h-full object-contain rounded-2xl"/>
      <button class="absolute top-4 right-4 text-white/50 hover:text-white text-3xl" @click="lightboxImg=null">×</button>
    </div>

    <!-- Session Modal -->
    <div v-if="openSessionModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="openSessionModal=false">
      <div class="bento-dark border border-white/10 w-full max-w-sm p-6 animate-scale-in">
        <h3 class="font-display text-xl font-bold text-white mb-5">📅 Jadwalkan Sesi</h3>
        <div class="space-y-3">
          <div><label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Tanggal & Waktu</label>
            <input v-model="sessForm.scheduled_at" type="datetime-local" class="input-light w-full"/></div>
          <div><label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Durasi</label>
            <select v-model="sessForm.duration_minutes" class="input-light w-full cursor-pointer">
              <option :value="30">30 menit</option><option :value="60">60 menit</option>
              <option :value="90">90 menit</option><option :value="120">120 menit</option>
            </select></div>
          <div><label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Platform / Lokasi</label>
            <input v-model="sessForm.location" type="text" placeholder="Zoom, Google Meet, offline..." class="input-light w-full"/></div>
          <div><label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Catatan</label>
            <textarea v-model="sessForm.notes" rows="2" class="input-light w-full resize-none"></textarea></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button @click="openSessionModal=false" class="btn-ghost flex-1">Batal</button>
          <button @click="scheduleSession" :disabled="schedulingSession" class="btn-primary flex-1 flex items-center justify-center gap-2">
            <span v-if="schedulingSession" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Jadwalkan
          </button>
        </div>
      </div>
    </div>

    <!-- Certificate Modal -->
    <div v-if="openCertModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="openCertModal=false">
      <div class="bento-dark border border-white/10 w-full max-w-md p-6 animate-scale-in">
        <h3 class="font-display text-xl font-bold text-white mb-2">🎓 Terbitkan Sertifikat</h3>
        <p class="text-white/40 text-xs mb-5">Terbitkan sertifikat digital. PDF dibuat otomatis.</p>
        <div class="space-y-3">
          <div><label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Nama Materi / Skill</label>
            <input v-model="certForm.skill_name" type="text" :placeholder="activeConv?.offer_skill?.name||'Nama skill yang diajarkan'" class="input-light w-full"/></div>
          <div><label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Deskripsi Pembelajaran</label>
            <textarea v-model="certForm.description" rows="4" placeholder="Apa saja yang dipelajari, topik utama, pencapaian..." class="input-light w-full resize-none"></textarea></div>
          <div><label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Nilai Quiz (opsional)</label>
            <input v-model.number="certForm.quiz_score" type="number" min="0" max="100" placeholder="cth: 85" class="input-light w-full"/></div>
        </div>
        <p class="mt-3 bg-white/5 rounded-xl p-3 text-xs text-white/40">
          Untuk <span class="text-white font-medium">{{ activeConv?.partner?.name }}</span> · Instruktur: <span class="text-white font-medium">{{ auth.user?.name }}</span>
        </p>
        <div class="flex gap-3 mt-4">
          <button @click="openCertModal=false" class="btn-ghost flex-1">Batal</button>
          <button @click="issueCertificate" :disabled="issuingCert||!certForm.skill_name||!certForm.description"
            class="btn-primary flex-1 flex items-center justify-center gap-2">
            <span v-if="issuingCert" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Terbitkan PDF
          </button>
        </div>
      </div>
    </div>

    <!-- Quiz Create Modal — FIX: Editable questions -->
    <div v-if="openQuizModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="openQuizModal=false">
      <div class="bento-dark border border-white/10 w-full max-w-lg p-6 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-hide">
        <h3 class="font-display text-xl font-bold text-white mb-5">📝 Buat Quiz</h3>

        <!-- Step 1: Generate settings -->
        <div v-if="quizStep === 1" class="space-y-3">
          <div><label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Topik Quiz</label>
            <input v-model="quizForm.topic" type="text" placeholder="Topik yang kamu ajarkan ke partner..." class="input-light w-full"/></div>
          <div class="grid grid-cols-3 gap-3">
            <div><label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Soal</label>
              <select v-model="quizForm.num" class="input-light w-full cursor-pointer">
                <option :value="3">3</option><option :value="5">5</option><option :value="8">8</option><option :value="10">10</option>
              </select></div>
            <div><label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Kesulitan</label>
              <select v-model="quizForm.difficulty" class="input-light w-full cursor-pointer">
                <option value="easy">Mudah</option><option value="medium">Sedang</option><option value="hard">Sulit</option>
              </select></div>
            <div><label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Lulus (%)</label>
              <input v-model.number="quizForm.pass_score" type="number" min="50" max="100" class="input-light w-full"/></div>
          </div>
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="quizForm.tutor_must_approve" type="checkbox" class="w-4 h-4 rounded accent-red-600"/>
            <span class="text-white/60 text-sm">Saya harus setujui sebelum exchange selesai</span>
          </label>
          <button @click="generateQuiz" :disabled="generatingQuiz || !quizForm.topic"
            class="btn-primary w-full flex items-center justify-center gap-2">
            <span v-if="generatingQuiz" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ generatingQuiz ? 'AI membuat soal...' : '✨ Generate dengan AI' }}
          </button>
        </div>

        <!-- Step 2: Edit generated questions -->
        <div v-if="quizStep === 2" class="space-y-4">
          <div>
            <label class="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5">Judul Quiz</label>
            <input v-model="quizForm.title" type="text" class="input-light w-full" placeholder="Judul quiz..."/>
          </div>
          <div class="flex items-center justify-between">
            <p class="text-white/50 text-xs font-semibold uppercase tracking-wider">Edit Soal</p>
            <span class="text-white/30 text-xs">Klik teks untuk mengedit</span>
          </div>

          <!-- Editable questions -->
          <div v-for="(q, i) in generatedQs" :key="i"
            class="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-colors">
            <div class="flex items-start gap-2 mb-3">
              <span class="text-white/50 text-xs font-bold mt-1 shrink-0">{{ i+1 }}.</span>
              <textarea v-model="generatedQs[i].question" rows="2"
                class="input-light flex-1 resize-none !text-sm !bg-white/5 !border-white/10" placeholder="Pertanyaan..."></textarea>
            </div>

            <div class="space-y-1.5 mb-3">
              <div v-for="(opt, oi) in q.options" :key="oi" class="flex items-center gap-2">
                <button type="button"
                  :class="['w-6 h-6 rounded-lg text-xs font-bold shrink-0 transition-colors border',
                    generatedQs[i].answer === optLetter(oi)
                      ? 'bg-green-600/40 border-green-500 text-green-300'
                      : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30']"
                  :title="'Jadikan jawaban benar'"
                  @click="generatedQs[i].answer = optLetter(oi)">
                  {{ optLetter(oi) }}
                </button>
                <input v-model="generatedQs[i].options[oi]" type="text"
                  class="input-light flex-1 !text-xs !py-1.5 !bg-white/5 !border-white/10" :placeholder="`Pilihan ${optLetter(oi)}...`"/>
              </div>
            </div>

            <div>
              <label class="text-white/30 text-[10px] font-semibold uppercase tracking-wider block mb-1">Penjelasan (opsional)</label>
              <input v-model="generatedQs[i].explanation" type="text"
                class="input-light w-full !text-xs !py-1.5 !bg-white/5 !border-white/10" placeholder="Penjelasan jawaban..."/>
            </div>
          </div>

          <div class="flex gap-3">
            <button @click="quizStep=1; generatedQs=[]" class="btn-ghost flex-1 !text-sm">← Generate Ulang</button>
            <button @click="submitQuiz" :disabled="submittingQuiz" class="btn-primary flex-1 !text-sm flex items-center justify-center gap-2">
              <span v-if="submittingQuiz" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Publish Quiz
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Quiz Attempt Modal -->
    <div v-if="quizAttemptModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="quizAttemptModal=false">
      <div class="bento-dark border border-white/10 w-full max-w-lg p-6 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-hide">
        <h3 class="font-display text-xl font-bold text-white mb-1">{{ currentQuiz?.title }}</h3>
        <p class="text-white/40 text-xs mb-5">Min. lulus: {{ currentQuiz?.pass_score ?? 70 }}%</p>
        <div v-if="!quizResult" class="space-y-5">
          <div v-for="(q, i) in currentQuiz?.questions" :key="i">
            <p class="text-white text-sm font-medium mb-2">{{ i+1 }}. {{ q.question }}</p>
            <div class="space-y-1.5">
              <button v-for="opt in q.options" :key="opt" @click="userAnswers[i] = opt[0]"
                :class="['w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border',
                  userAnswers[i] === opt[0] ? 'bg-red-600/30 border-red-500/50 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 border-transparent']">
                {{ opt }}
              </button>
            </div>
          </div>
          <button @click="submitAttempt" :disabled="!allAnswered || submittingAttempt"
            class="btn-primary w-full flex items-center justify-center gap-2">
            <span v-if="submittingAttempt" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Submit Jawaban
          </button>
        </div>
        <div v-else class="space-y-4">
          <div :class="['text-center p-5 rounded-3xl', quizResult.passed ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30']">
            <div class="text-4xl mb-2">{{ quizResult.passed ? '🎉' : '😅' }}</div>
            <p class="font-display text-3xl font-extrabold text-white">{{ quizResult.score }}%</p>
            <p :class="['text-sm mt-1', quizResult.passed ? 'text-green-400' : 'text-red-400']">
              {{ quizResult.passed ? `Lulus! +${quizResult.xp} XP` : `Belum lulus. Butuh ${quizResult.pass_score ?? 70}%` }}
            </p>
            <p v-if="quizResult.needs_approval" class="text-amber-400 text-xs mt-2">⏳ Menunggu persetujuan pembuat quiz</p>
          </div>
          <div v-for="(r,i) in quizResult.results" :key="i"
            :class="['rounded-2xl p-3', r.is_correct ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20']">
            <p class="text-white text-xs font-medium mb-1">{{ i+1 }}. {{ r.question }}</p>
            <p :class="['text-xs', r.is_correct ? 'text-green-400' : 'text-red-400']">
              {{ r.is_correct ? '✓ Benar' : `✗ Jawaban benar: ${r.correct}` }}
            </p>
            <p v-if="r.explanation" class="text-white/40 text-xs mt-1 italic">{{ r.explanation }}</p>
          </div>
          <button @click="quizAttemptModal=false; quizResult=null" class="btn-ghost w-full">Tutup</button>
        </div>
      </div>
    </div>

    <!-- Attempts Panel -->
    <div v-if="attemptsPanel" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="attemptsPanel=false">
      <div class="bento-dark border border-white/10 w-full max-w-md p-6 animate-scale-in max-h-[80vh] overflow-y-auto scrollbar-hide">
        <h3 class="font-display text-xl font-bold text-white mb-4">Hasil Quiz</h3>
        <div v-if="quizAttemptsList.length" class="space-y-3">
          <div v-for="a in quizAttemptsList" :key="a.id" class="bg-white/5 rounded-2xl p-4">
            <div class="flex items-center gap-3 mb-2">
              <img :src="a.user?.avatar_url" class="w-9 h-9 rounded-full object-cover"/>
              <div class="flex-1"><p class="text-white font-semibold text-sm">{{ a.user?.name }}</p></div>
              <p :class="['font-bold text-lg', a.passed ? 'text-green-400' : 'text-red-400']">{{ a.score }}%</p>
            </div>
            <button v-if="a.passed && !a.tutor_approved"
              @click="approveAttempt(a); attemptsPanel=false"
              class="btn-primary w-full !text-xs !py-2 flex items-center justify-center gap-2">
              <span v-if="approvingId===a.id" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ✅ Setujui & Selesaikan Pembelajaran
            </button>
            <p v-else-if="a.tutor_approved" class="text-green-400 text-xs text-center mt-1">✓ Sudah disetujui</p>
          </div>
        </div>
        <p v-else class="text-white/30 text-center py-8">Belum ada yang mengerjakan.</p>
        <button @click="attemptsPanel=false" class="btn-ghost w-full mt-4 !text-sm">Tutup</button>
      </div>
    </div>

    <!-- Rating Modal -->
    <div v-if="ratingModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="ratingModal=false">
      <div class="bento-dark border border-white/10 w-full max-w-sm p-6 animate-scale-in">
        <h3 class="font-display text-xl font-bold text-white mb-5">Beri Rating</h3>
        <div class="flex justify-center gap-3 mb-5">
          <button v-for="n in 5" :key="n" @click="ratingForm.score=n"
            :class="['text-4xl transition-all hover:scale-110', n <= ratingForm.score ? 'opacity-100' : 'opacity-20']">⭐</button>
        </div>
        <textarea v-model="ratingForm.comment" rows="3" placeholder="Komentar (opsional)..." class="input w-full resize-none mb-4"></textarea>
        <div class="flex gap-3">
          <button @click="ratingModal=false" class="btn-ghost flex-1">Batal</button>
          <button @click="submitRating" :disabled="submittingRating" class="btn-primary flex-1 flex items-center justify-center gap-2">
            <span v-if="submittingRating" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Kirim Rating
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth  = useAuthStore()
const route = useRoute()
const toast = useToast()

const conversations    = ref([]), loadingConvos = ref(true), activeConv = ref(null)
const messages         = ref([]), newMsg = ref(''), sending = ref(false)
const attachmentFile   = ref(null), fileInput = ref(null)
const msgBox           = ref(null), lightboxImg = ref(null)
const openSessionModal = ref(false), schedulingSession = ref(false)
const openQuizModal    = ref(false), quizStep = ref(1)
const generatingQuiz   = ref(false), generatedQs = ref([]), submittingQuiz = ref(false)
const openCertModal    = ref(false), issuingCert = ref(false)
const quizAttemptModal = ref(false), currentQuiz = ref(null), quizResult = ref(null)
const userAnswers      = ref({}), submittingAttempt = ref(false)
const attemptsPanel    = ref(false), quizAttemptsList = ref([]), approvingId = ref(null)
const ratingModal      = ref(false), submittingRating = ref(false), hasRated = ref(false)
const activeSessions   = ref([]), activeQuizzes = ref([])
const myAttemptedQuizIds = ref(new Set())
const pendingApprovals   = ref([]), quizProgress = ref([])

const sessForm  = ref({ scheduled_at:'', duration_minutes:60, location:'', notes:'' })
const quizForm  = ref({ topic:'', num:5, difficulty:'medium', title:'', pass_score:70, tutor_must_approve:true })
const certForm  = ref({ skill_name:'', description:'', quiz_score:null })
const ratingForm= ref({ score:5, comment:'' })

const allAnswered = computed(() =>
  currentQuiz.value ? Object.keys(userAnswers.value).length === currentQuiz.value.questions?.length : false
)

function hasAttempted(quizId) { return myAttemptedQuizIds.value.has(quizId) }
function optLetter(i)         { return ['A','B','C','D','E'][i] || String(i) }

let poller = null, msgPoller = null

onMounted(async () => {
  const r = await api.get('/conversations')
  conversations.value = r.data
  loadingConvos.value  = false
  if (route.params.id) {
    const found = conversations.value.find(c => c.id === Number(route.params.id))
    if (found) await selectConv(found)
  }
})
onUnmounted(() => { clearInterval(poller); clearInterval(msgPoller) })

async function selectConv(conv) {
  activeConv.value          = conv
  quizResult.value          = null
  myAttemptedQuizIds.value  = new Set()
  clearInterval(poller); clearInterval(msgPoller)
  await loadMessages()
  await loadQuizzesAndSessions()
  if (conv.status === 'completed') {
    const r = await api.get(`/ratings/exchange/${conv.id}/check`)
    hasRated.value = r.data.has_rated
  }
  msgPoller = setInterval(loadMessages, 4000)
  poller    = setInterval(loadQuizzesAndSessions, 15000)
}

async function loadMessages() {
  if (!activeConv.value) return
  try {
    const r = await api.get(`/messages/${activeConv.value.id}`)
    messages.value = r.data
    await api.put(`/messages/${activeConv.value.id}/read`)
    await nextTick()
    if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight
    const c = conversations.value.find(x => x.id === activeConv.value.id)
    if (c) c.unread_count = 0
  } catch {}
}

async function loadQuizzesAndSessions() {
  if (!activeConv.value) return
  try {
    const [sR, qR, aR] = await Promise.all([
      api.get('/sessions'),
      api.get(`/exchanges/${activeConv.value.id}/quizzes`),
      api.get(`/exchanges/${activeConv.value.id}/attempts`),
    ])
    activeSessions.value = sR.data.filter(s => s.exchange_id === activeConv.value.id && s.status === 'scheduled')
    activeQuizzes.value  = qR.data
    const attempts       = aR.data || []
    const myNew          = new Set(myAttemptedQuizIds.value)
    attempts.filter(a => a.user_id === auth.user?.id).forEach(a => myNew.add(a.quiz_id))
    myAttemptedQuizIds.value = myNew
    pendingApprovals.value   = attempts.filter(a =>
      a.passed && !a.tutor_approved &&
      activeQuizzes.value.some(q => q.id === a.quiz_id && q.creator_id === auth.user?.id)
    )
    quizProgress.value = qR.data.map(quiz => {
      const uid      = auth.user?.id
      const myAttempt    = quiz.creator_id !== uid ? attempts.find(a => a.quiz_id===quiz.id && a.user_id===uid) : null
      const theirAttempt = quiz.creator_id === uid ? attempts.find(a => a.quiz_id===quiz.id && a.user_id!==uid) : null
      return { quiz, isMyQuiz: quiz.creator_id === uid, myAttempt, theirAttempt }
    })
  } catch {}
}

async function sendMessage() {
  if (!newMsg.value.trim() && !attachmentFile.value) return
  sending.value = true
  try {
    const fd = new FormData()
    fd.append('exchange_id', activeConv.value.id)
    if (newMsg.value.trim()) fd.append('body', newMsg.value.trim())
    if (attachmentFile.value) fd.append('attachment', attachmentFile.value)

    // Pakai fetch langsung — bukan axios
    // Browser otomatis set Content-Type: multipart/form-data; boundary=...
    const token = localStorage.getItem('sv_token')
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

    const res = await fetch(`${apiBase}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        // JANGAN set Content-Type di sini — biarkan browser set sendiri
      },
      body: fd,
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Gagal mengirim pesan.')
    }

    newMsg.value = ''
    removeAttachment()
    await loadMessages()
  } catch(e) {
    toast.error(e.message || 'Gagal mengirim.')
  } finally { sending.value = false }
}

function pickFile(e) {
  const f = e.target.files[0]
  if (!f) return
  if (f.size > 10*1024*1024) { toast.error('File maksimal 10MB'); return }
  attachmentFile.value = f
}
function removeAttachment() {
  attachmentFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function scheduleSession() {
  if (!sessForm.value.scheduled_at) { toast.error('Pilih tanggal sesi.'); return }
  schedulingSession.value = true
  try {
    await api.post('/sessions', { exchange_id: activeConv.value.id, ...sessForm.value })
    toast.success('Sesi dijadwalkan!')
    openSessionModal.value = false
    sessForm.value = { scheduled_at:'', duration_minutes:60, location:'', notes:'' }
    await loadQuizzesAndSessions()
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal.') }
  finally { schedulingSession.value = false }
}

async function generateQuiz() {
  generatingQuiz.value = true
  try {
    const r = await api.post('/quiz/generate', { topic:quizForm.value.topic, num_questions:quizForm.value.num, difficulty:quizForm.value.difficulty })
    generatedQs.value    = r.data.questions.map(q => ({ ...q })) // deep copy for editing
    quizForm.value.title = quizForm.value.topic + ' Quiz'
    quizStep.value       = 2
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal generate soal.') }
  finally { generatingQuiz.value = false }
}

async function submitQuiz() {
  if (!quizForm.value.title) { toast.error('Isi judul quiz.'); return }
  submittingQuiz.value = true
  try {
    await api.post('/quizzes', {
      exchange_id:        activeConv.value.id,
      title:              quizForm.value.title,
      questions:          generatedQs.value,
      is_published:       true,
      pass_score:         quizForm.value.pass_score,
      tutor_must_approve: quizForm.value.tutor_must_approve,
    })
    toast.success('Quiz dipublikasikan! Partner mendapat notifikasi.')
    openQuizModal.value  = false
    quizStep.value       = 1
    generatedQs.value    = []
    quizForm.value       = { topic:'', num:5, difficulty:'medium', title:'', pass_score:70, tutor_must_approve:true }
    await loadQuizzesAndSessions()
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal.') }
  finally { submittingQuiz.value = false }
}

async function openQuizAttempt(quiz) {
  const r = await api.get(`/quizzes/${quiz.id}`)
  currentQuiz.value      = { ...r.data, pass_score: quiz.pass_score ?? 70 }
  userAnswers.value      = {}
  quizResult.value       = null
  quizAttemptModal.value = true
}

async function submitAttempt() {
  submittingAttempt.value = true
  try {
    const answers = currentQuiz.value.questions.map((_, i) => userAnswers.value[i] || '')
    const r       = await api.post(`/quizzes/${currentQuiz.value.id}/attempt`, { answers })
    quizResult.value = { ...r.data, pass_score: currentQuiz.value.pass_score }
    const updated    = new Set(myAttemptedQuizIds.value)
    updated.add(currentQuiz.value.id)
    myAttemptedQuizIds.value = updated
    if (r.data.passed) toast.success(`Lulus! +${r.data.xp} XP 🎉`)
    else toast.info(`Skor: ${r.data.score}%. Butuh ${currentQuiz.value.pass_score}%`)
    await auth.refreshUser()
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal.') }
  finally { submittingAttempt.value = false }
}

async function openAttemptsPanel(quiz) {
  const r = await api.get(`/exchanges/${activeConv.value.id}/attempts`)
  quizAttemptsList.value = r.data.filter(a => a.quiz_id === quiz.id)
  attemptsPanel.value    = true
}

async function approveAttempt(attempt) {
  approvingId.value = attempt.id
  try {
    await api.put(`/quiz-attempts/${attempt.id}/approve`)
    toast.success('Disetujui! Memeriksa status exchange... 🎓')
    pendingApprovals.value = pendingApprovals.value.filter(a => a.id !== attempt.id)
    // Refresh to check if exchange is now completed
    await loadQuizzesAndSessions()
    const exR = await api.get(`/exchanges/${activeConv.value.id}`)
    if (exR.data.status === 'completed') {
      activeConv.value.status = 'completed'
      toast.success('Exchange selesai! Sertifikat diterbitkan. +50 XP 🎓')
    }
    await auth.refreshUser()
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal.') }
  finally { approvingId.value = null }
}

async function issueCertificate() {
  issuingCert.value = true
  try {
    const r = await api.post('/certificates/issue', {
      exchange_id:  activeConv.value.id,
      recipient_id: activeConv.value.partner?.id,
      skill_name:   certForm.value.skill_name,
      description:  certForm.value.description,
      quiz_score:   certForm.value.quiz_score || null,
    })
    toast.success('Sertifikat diterbitkan!')
    openCertModal.value = false
    certForm.value = { skill_name:'', description:'', quiz_score:null }
    if (r.data.certificate?.pdf_url) window.open(r.data.certificate.pdf_url, '_blank')
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal.') }
  finally { issuingCert.value = false }
}

async function submitRating() {
  submittingRating.value = true
  try {
    const partnerId = activeConv.value.requester_id === auth.user?.id
      ? activeConv.value.provider?.id : activeConv.value.requester?.id
    await api.post('/ratings', { exchange_id:activeConv.value.id, rated_id:partnerId, score:ratingForm.value.score, comment:ratingForm.value.comment })
    toast.success('Rating terkirim!')
    hasRated.value = true; ratingModal.value = false
    await auth.refreshUser()
  } catch(e) { toast.error(e.response?.data?.message || 'Gagal.') }
  finally { submittingRating.value = false }
}

function isImage(t)     { return t && t.startsWith('image/') }
function fileIcon(t)    { if (!t) return '📎'; if (t.startsWith('image/')) return '🖼️'; if (t==='application/pdf') return '📄'; if (t.includes('word')) return '📝'; if (t.includes('zip')) return '📦'; return '📎' }
function formatBytes(b) { if (!b) return ''; if (b<1024) return b+' B'; if (b<1048576) return (b/1024).toFixed(1)+' KB'; return (b/1048576).toFixed(1)+' MB' }
function lastMsgPreview(c) { if (!c.last_message) return 'Mulai chat...'; if (c.last_message.attachment_name) return '📎 '+c.last_message.attachment_name; return c.last_message.body || 'Mulai chat...' }
function formatTime(d)  { return new Date(d).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) }
function formatFull(d)  { return new Date(d).toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) }
function statusClass(s) { return {accepted:'bg-green-500/20 text-green-400',completed:'bg-blue-500/20 text-blue-400',pending:'bg-amber-500/20 text-amber-400'}[s]||'bg-white/10 text-white/40' }
function statusLabel(s) { return {accepted:'Aktif',completed:'Selesai',pending:'Menunggu',rejected:'Ditolak'}[s]||s }
</script>
