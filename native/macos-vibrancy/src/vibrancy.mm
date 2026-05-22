#import <AppKit/AppKit.h>
#include <napi.h>

static NSString* const kVibrancyId = @"meeemo_vibrancy";

// Private CoreGraphics API used by Terminal, wezterm, ghostty for true window blur.
// Resolved at link time from the SkyLight framework (loaded via AppKit).
extern "C" {
    typedef int CGSConnectionID;
    typedef uint32_t CGSWindowID;
    CGSConnectionID CGSMainConnectionID(void);
    OSStatus CGSSetWindowBackgroundBlurRadius(CGSConnectionID cid, CGSWindowID wid, int blur);
}

static NSView* ViewFromBuffer(Napi::Buffer<unsigned char> buf) {
    void* ptr = *reinterpret_cast<void**>(buf.Data());
    return (__bridge NSView*)ptr;
}

Napi::Value SetVibrancy(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsBuffer()) {
        Napi::TypeError::New(env, "First arg must be Buffer from getNativeWindowHandle()")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    NSView* rootView = ViewFromBuffer(info[0].As<Napi::Buffer<unsigned char>>());
    if (!rootView || !rootView.window) return env.Null();

    NSVisualEffectMaterial material = NSVisualEffectMaterialUnderWindowBackground;
    if (info.Length() >= 2 && info[1].IsString()) {
        std::string mat = info[1].As<Napi::String>().Utf8Value();
        if (mat == "sidebar")              material = NSVisualEffectMaterialSidebar;
        else if (mat == "popover")         material = NSVisualEffectMaterialPopover;
        else if (mat == "menu")            material = NSVisualEffectMaterialMenu;
        else if (mat == "titlebar")        material = NSVisualEffectMaterialTitlebar;
        else if (mat == "header")          material = NSVisualEffectMaterialHeaderView;
        else if (mat == "window-background") material = NSVisualEffectMaterialWindowBackground;
    }

    dispatch_async(dispatch_get_main_queue(), ^{
        NSView* container = rootView;
        for (NSView* sub in [container.subviews copy]) {
            if ([sub.identifier isEqualToString:kVibrancyId]) [sub removeFromSuperview];
        }

        NSVisualEffectView* vfx = [[NSVisualEffectView alloc] initWithFrame:container.bounds];
        vfx.identifier = kVibrancyId;
        vfx.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
        vfx.blendingMode = NSVisualEffectBlendingModeBehindWindow;
        vfx.material = material;
        vfx.state = NSVisualEffectStateActive;

        [container addSubview:vfx positioned:NSWindowBelow relativeTo:nil];
    });

    return env.Null();
}

Napi::Value RemoveVibrancy(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsBuffer()) {
        Napi::TypeError::New(env, "First arg must be Buffer from getNativeWindowHandle()")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    NSView* rootView = ViewFromBuffer(info[0].As<Napi::Buffer<unsigned char>>());
    if (!rootView) return env.Null();

    dispatch_async(dispatch_get_main_queue(), ^{
        for (NSView* sub in [rootView.subviews copy]) {
            if ([sub.identifier isEqualToString:kVibrancyId]) [sub removeFromSuperview];
        }
    });

    return env.Null();
}

Napi::Value SetBackgroundBlurRadius(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsBuffer() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected (Buffer, Number)")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    NSView* rootView = ViewFromBuffer(info[0].As<Napi::Buffer<unsigned char>>());
    if (!rootView || !rootView.window) return env.Null();

    int blur = info[1].As<Napi::Number>().Int32Value();
    NSWindow* nswin = rootView.window;
    CGSConnectionID conn = CGSMainConnectionID();
    CGSWindowID wid = (CGSWindowID)[nswin windowNumber];

    CGSSetWindowBackgroundBlurRadius(conn, wid, blur);
    return env.Null();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("setVibrancy", Napi::Function::New(env, SetVibrancy));
    exports.Set("removeVibrancy", Napi::Function::New(env, RemoveVibrancy));
    exports.Set("setBackgroundBlurRadius", Napi::Function::New(env, SetBackgroundBlurRadius));
    return exports;
}

NODE_API_MODULE(macos_vibrancy, Init)
