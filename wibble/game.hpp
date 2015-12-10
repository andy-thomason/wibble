#include <cmath>
#include <unordered_map>

namespace wibble {
  struct data {
    size_t ref_count_ = 0;
  };

  template <class Data>
  class object {
  public:
    using value_t = Data;

    object() { value_ = new value_t(); }
    object(object &rhs) { value_ = rhs.value_; value_->ref_count_++; }
    object(object &&rhs) { value_ = rhs.value_; rhs.value_ = nullptr; }

  protected:
    value_t value() const { return value_; }
  private:
    value_t *value_;
  };

  struct floatarray_data_t : data {
    std::vector<float> value;
  };

  class floatarray : public object<floatarray_data_t> {
  public:
    floatarray() {
    }
    void operator()(std::initializer_list<float> &il) {
      value().value.resize(il.size());
      std::copy(il.begin(), il.end(), value().value.begin());
    }
  private:
  };

  struct mat4_data_t : data  {
    std::array<float, 16> value;
  };

  class mat4 : public object<mat4_data_t> {
  public:
    mat4() {
    }
    void operator()(std::initializer_list<float> &il) {
      std::copy(il.begin(), il.end(), value().value.begin());
    }
  private:
  };

  struct vec4_data_t : data  {
    std::array<float, 4> value;
  };

  class vec4 : public object<vec4_data_t> {
  public:
    vec4() {
    }
    void operator()(std::initializer_list<float> &il) {
      std::copy(il.begin(), il.end(), value().value.begin());
    }
  private:
  };

  struct vec3_data_t : data  {
    std::array<float, 3> value;
  };

  class vec3 : public object<vec3_data_t> {
  public:
    vec3() {
    }
    void operator()(std::initializer_list<float> &il) {
      std::copy(il.begin(), il.end(), value().value.begin());
    }
  private:
  };

  struct component_data_t : data {
    floatarray vertices;
    floatarray normals;
    std::array<floatarray, 8> uvs;
  };

  class component : public object<component_data_t> {
  public:
    component() {
    }

    floatarray vertices() const { return value().vertices; }
    floatarray normals() const { return value().normals; }
    floatarray uvs(int n) const { return value().uvs[n]; }
  private:
  };

  struct node_data_t {
  };

  class node : public object<node_data_t> {
  public:
    node() {
    }
  private:
  };

  struct geometry_data_t {
  };

  class geometry : public object<geometry_data_t> {
  public:
    geometry() {
    }
  private:
  };

  struct camera_data_t {
  };

  class camera : public object<camera_data_t> {
  public:
    camera() {
    }
  private:
  };

  struct light_data_t {
  };

  class light : public object<light_data_t> {
  public:
    light() {
    }
  private:
  };

  struct material_data_t {
  };

  class material : public object<material_data_t> {
  public:
    material() {
    }
  private:
  };

  struct shader_data_t {
  };

  class shader : public object<shader_data_t> {
  public:
    shader() {
    }
  private:
  };


  // generic game class.
  class game {
  public:
    game() {
    }

    virtual void update(const json &input, const json &output) {
    }

    // simulate the game
    void do_frame(const std::string &data_in, std::string &data_out) {
      json input = json::parse(data_in.c_str());
      json output;

      update(input, output);
      frame_number_++;

      data_out = output.dump();
    }

    scene scene() {
      return scenes_.emplace_back();
    }

  private:
    std::vector<scene> scenes_;
    int frame_number_ = 0;
  };
}
